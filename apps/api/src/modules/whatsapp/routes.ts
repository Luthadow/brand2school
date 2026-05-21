import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { processParticipationSubmission } from "../participation/services/processParticipationSubmission.js";
import { getSchoolParticipationProgress } from "../schools/schoolParticipation.js";
import { findSchoolByCode, findSchoolByWhatsapp } from "../schools/registerSchool.js";
import { sendWhatsAppText } from "../../lib/whatsappOutbound.js";
import { getSchoolCampaignProgress } from "../participation/services/campaignProgress.js";
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

type ParsedSubmit = {
  kind: "submit";
  schoolName: string;
  district: string;
  campaignSlug: string;
  productCode: string;
};

type ParsedProgress = {
  kind: "progress";
  schoolName: string;
  district: string;
};

type ParsedStatus = {
  kind: "status";
  schoolCode?: string;
};

type ParsedCommand =
  | ParsedSubmit
  | ParsedProgress
  | ParsedStatus
  | { kind: "menu" }
  | { kind: "campaigns" }
  | { kind: "help" };

const WELCOME_MENU = [
  "Welcome to Brand2School",
  "",
  "1. Submit Code",
  "2. Check School Progress",
  "3. View Campaigns",
  "4. Help My School",
  "",
  "Reply with a number or send a command.",
  "",
  "Submit:",
  "SUBMIT | School Name | District | campaign-slug | PRODUCT_CODE",
  "",
  "Progress:",
  "PROGRESS | School Name | District"
].join("\n");

function parseSubmitMessage(message: string): ParsedSubmit | null {
  const parts = message
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length !== 5) return null;
  if (parts[0].toUpperCase() !== "SUBMIT") return null;

  return {
    kind: "submit",
    schoolName: parts[1],
    district: parts[2],
    campaignSlug: parts[3].toLowerCase(),
    productCode: parts[4].toUpperCase()
  };
}

function parseProgressMessage(message: string): ParsedProgress | null {
  const parts = message
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length !== 3) return null;
  if (parts[0].toUpperCase() !== "PROGRESS") return null;

  return {
    kind: "progress",
    schoolName: parts[1],
    district: parts[2]
  };
}

function parseStatusMessage(message: string): ParsedStatus | null {
  const trimmed = message.trim();
  const upper = trimmed.toUpperCase();
  if (upper === "STATUS" || upper === "4" || upper === "HELP MY SCHOOL") {
    return { kind: "status" };
  }

  const parts = trimmed.split(/\s+/);
  if (parts[0]?.toUpperCase() === "STATUS" && parts[1]) {
    return { kind: "status", schoolCode: parts[1].toUpperCase() };
  }

  return null;
}

function parseCommand(message: string): ParsedCommand | null {
  const trimmed = message.trim();
  const upper = trimmed.toUpperCase();

  if (upper === "MENU" || upper === "HELP" || upper === "HI" || upper === "HELLO") {
    return { kind: "menu" };
  }
  if (upper === "3" || upper === "CAMPAIGNS" || upper === "VIEW CAMPAIGNS") {
    return { kind: "campaigns" };
  }

  const submit = parseSubmitMessage(trimmed);
  if (submit) return submit;

  const progress = parseProgressMessage(trimmed);
  if (progress) return progress;

  const status = parseStatusMessage(trimmed);
  if (status) return status;

  return null;
}

function submitPrompt(): string {
  return [
    "Submit Code",
    "",
    "Send:",
    "SUBMIT | School Name | District | campaign-slug | PRODUCT_CODE",
    "",
    "Example:",
    "SUBMIT | Your School Name | Your District | campaign-slug | BRAND-CODE-26-XXXXXX-XX"
  ].join("\n");
}

function progressPrompt(): string {
  return [
    "Check School Progress",
    "",
    "Send:",
    "PROGRESS | School Name | District",
    "",
    "Example:",
    "PROGRESS | Rustenburg Secondary | Rustenburg"
  ].join("\n");
}

async function campaignsMessage(): Promise<string> {
  const campaigns = await prisma.campaign.findMany({
    where: { isActive: true },
    include: { brand: { select: { name: true } } },
    orderBy: { name: "asc" },
    take: 10
  });

  if (campaigns.length === 0) {
    return "No active campaigns right now. Check back soon or visit brand2school.co.za";
  }

  const lines = campaigns.map((c) => {
    const goal = c.infrastructureGoal ? ` — ${c.infrastructureGoal}` : "";
    return `• ${c.name} (${c.slug})${goal}\n  by ${c.brand.name}`;
  });

  return ["Active Campaigns", "", ...lines, "", "Submit with:", "SUBMIT | School | District | campaign-slug | CODE"].join(
    "\n"
  );
}

async function schoolStatusMessage(school: {
  id: string;
  name: string;
  schoolCode: string;
  status: string;
  province: string;
  district: string;
}): Promise<string> {
  const campaigns = await prisma.campaign.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" }
  });

  const progressLines = await Promise.all(
    campaigns.map(async (campaign) => {
      const progress = await getSchoolCampaignProgress(school.id, campaign.id, campaign.targetSubmissions);
      const goal = campaign.infrastructureGoal ? ` (${campaign.infrastructureGoal})` : "";
      return `${campaign.name}${goal}: ${progress.percentToTarget}% — ${progress.validSubmissions}/${progress.targetSubmissions}`;
    })
  );

  return [
    `School: ${school.name}`,
    `Code: ${school.schoolCode}`,
    `Status: ${school.status}`,
    `Location: ${school.district}, ${school.province}`,
    "",
    "Campaign progress:",
    progressLines.length ? progressLines.join("\n") : "No active campaigns yet.",
    "",
    "Families submit:",
    "SUBMIT | School Name | District | campaign-slug | PRODUCT_CODE"
  ].join("\n");
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

  const upper = msg.toUpperCase();

  if (upper === "1" || upper === "SUBMIT" || upper === "SUBMIT CODE") {
    await replyJson(res, from, 200, { message: submitPrompt() });
    return;
  }
  if (upper === "2" || upper === "PROGRESS" || upper === "CHECK SCHOOL PROGRESS") {
    await replyJson(res, from, 200, { message: progressPrompt() });
    return;
  }

  const parsed = parseCommand(msg);
  if (!parsed) {
    await replyJson(res, from, 200, { message: WELCOME_MENU });
    return;
  }

  if (parsed.kind === "menu" || parsed.kind === "help") {
    await replyJson(res, from, 200, { message: WELCOME_MENU });
    return;
  }

  if (parsed.kind === "campaigns") {
    await replyJson(res, from, 200, { message: await campaignsMessage() });
    return;
  }

  if (parsed.kind === "status") {
    const school = parsed.schoolCode
      ? await findSchoolByCode(parsed.schoolCode)
      : from
        ? await findSchoolByWhatsapp(from)
        : null;

    if (!school) {
      await replyJson(res, from, 404, {
        message: parsed.schoolCode
          ? "School code not found. Register at the Brand2School website."
          : "No school linked to this WhatsApp number. Principals can register on the website."
      });
      return;
    }

    await replyJson(res, from, 200, { message: await schoolStatusMessage(school) });
    return;
  }

  if (parsed.kind === "progress") {
    const result = await getSchoolParticipationProgress(parsed.schoolName, parsed.district);
    if (!result) {
      await replyJson(res, from, 404, {
        message: `School not found for "${parsed.schoolName}" in ${parsed.district}.`
      });
      return;
    }

    const lines = result.progress.map((p: { name: string; percentToTarget: number; validSubmissions: number; targetSubmissions: number; infrastructureGoal: string | null }) => {
      const goal = p.infrastructureGoal ? `\n  Unlock: ${p.infrastructureGoal}` : "";
      return `${p.name}: ${p.percentToTarget}% (${p.validSubmissions}/${p.targetSubmissions})${goal}`;
    });

    await replyJson(res, from, 200, {
      message: [
        result.school.name,
        `${result.school.district}, ${result.school.province}`,
        "",
        "Campaign progress:",
        lines.length ? lines.join("\n\n") : "No active campaigns yet."
      ].join("\n")
    });
    return;
  }

  const result = await processParticipationSubmission({
    schoolName: parsed.schoolName,
    district: parsed.district,
    campaignSlug: parsed.campaignSlug,
    productCode: parsed.productCode,
    whatsappMsisdn: from
  });

  const message =
    typeof result.payload === "object" && result.payload && "message" in result.payload
      ? String((result.payload as { message: string }).message)
      : "Submission processed.";

  await replyJson(res, from, result.status, { ...result.payload, message });
});
