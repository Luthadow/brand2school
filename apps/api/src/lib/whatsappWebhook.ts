import { createHmac, timingSafeEqual } from "crypto";
import type { Request } from "express";
import { env } from "../config/env.js";

export type RawBodyRequest = Request & { rawBody?: Buffer };

export function verifyMetaWebhookSignature(req: RawBodyRequest): boolean {
  const secret = env.WHATSAPP_APP_SECRET;
  if (!secret) {
    return env.NODE_ENV === "development";
  }

  const signatureHeader = req.headers["x-hub-signature-256"];
  if (typeof signatureHeader !== "string" || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const rawBody = req.rawBody;
  if (!rawBody) {
    return false;
  }

  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const provided = signatureHeader;

  if (expected.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

export function verifyMetaWebhookChallenge(query: Record<string, unknown>): string | null {
  const mode = query["hub.mode"];
  const token = query["hub.verify_token"];
  const challenge = query["hub.challenge"];

  if (mode !== "subscribe" || typeof token !== "string" || typeof challenge !== "string") {
    return null;
  }

  const verifyToken = env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken) {
    return env.NODE_ENV === "development" ? challenge : null;
  }

  return token === verifyToken ? challenge : null;
}
