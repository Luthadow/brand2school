import { Router } from "express";
import { processParticipationSubmission } from "../participation/services/processParticipationSubmission.js";
import { sendWhatsAppText } from "../../lib/whatsappOutbound.js";
import { whatsappRateLimit } from "../../middleware/rateLimit.js";
import { whatsappMsisdnRateLimit } from "../../middleware/msisdnRateLimit.js";
import { parseInboundWhatsApp } from "../../lib/whatsappInbound.js";
import { isDuplicateWebhookEvent } from "../../lib/webhookDedup.js";
import { applyWhatsAppDeliveryStatus } from "../../lib/whatsappQueue.js";
import {
  verifyMetaWebhookChallenge,
  verifyMetaWebhookSignature,
  type RawBodyRequest
} from "../../lib/whatsappWebhook.js";
import { handleWhatsAppConversation } from "./handleConversation.js";

/** Legacy one-line submit: SUBMIT | School | District | slug | CODE */
function parseLegacySubmit(message: string): {
  schoolName: string;
  district: string;
  campaignSlug: string;
  productCode: string;
} | null {
  const parts = message
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length !== 5 || parts[0].toUpperCase() !== "SUBMIT") return null;
  return {
    schoolName: parts[1],
    district: parts[2],
    campaignSlug: parts[3].toLowerCase(),
    productCode: parts[4].toUpperCase()
  };
}

async function replyJson(
  res: import("express").Response,
  from: string | undefined,
  status: number,
  body: { message: string } & Record<string, unknown>
): Promise<void> {
  if (from) {
    await sendWhatsAppText(from, body.message).catch(() => null);
  }
  res.status(status).json(body);
}

export const whatsappRouter = Router();

whatsappRouter.get("/webhook", (req, res) => {
  const challenge = verifyMetaWebhookChallenge(req.query as Record<string, unknown>);
  if (!challenge) {
    res.status(403).json({ message: "Webhook verification failed." });
    return;
  }
  res.status(200).send(challenge);
});

whatsappRouter.post("/webhook", whatsappRateLimit, whatsappMsisdnRateLimit, async (req, res) => {
  if (!verifyMetaWebhookSignature(req as RawBodyRequest)) {
    res.status(401).json({ message: "Invalid WhatsApp webhook signature." });
    return;
  }

  const inbound = parseInboundWhatsApp(req.body);
  if (!inbound) {
    res.status(200).json({ message: "Ignored webhook event." });
    return;
  }

  if (inbound.kind === "status") {
    if (await isDuplicateWebhookEvent(`wa-status:${inbound.data.messageId}:${inbound.data.status}`)) {
      res.status(200).json({ message: "Duplicate status event." });
      return;
    }
    await applyWhatsAppDeliveryStatus(
      inbound.data.messageId,
      inbound.data.status,
      inbound.data.recipientId
    );
    res.status(200).json({ message: "Delivery status recorded." });
    return;
  }

  const from = inbound.kind === "test" ? inbound.data.from : inbound.data.from;
  const msg = inbound.kind === "test" ? inbound.data.message.trim() : inbound.data.text.trim();
  const dedupId =
    inbound.kind === "message" ? `wa-msg:${inbound.data.messageId}` : `wa-test:${from}:${msg}`;

  if (await isDuplicateWebhookEvent(dedupId)) {
    res.status(200).json({ message: "Duplicate message event." });
    return;
  }

  const legacy = parseLegacySubmit(msg);
  if (legacy && from) {
    const result = await processParticipationSubmission({
      schoolName: legacy.schoolName,
      district: legacy.district,
      campaignSlug: legacy.campaignSlug,
      productCode: legacy.productCode,
      whatsappMsisdn: from,
      source: "whatsapp"
    });
    const message =
      typeof result.payload === "object" && result.payload && "message" in result.payload
        ? String((result.payload as { message: string }).message)
        : "Submission processed.";
    await replyJson(res, from, result.status, { ...result.payload, message });
    return;
  }

  const result = await handleWhatsAppConversation(from ?? "test-user", msg);
  await replyJson(res, from, result.status, { message: result.message });
});
