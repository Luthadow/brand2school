import type { NextFunction, Request, Response } from "express";

const WINDOW_MS = 60_000;
const MAX_PER_MSISDN = 12;
const hits = new Map<string, { count: number; resetAt: number }>();

function keyForMsisdn(msisdn: string): string {
  return msisdn.replace(/\D/g, "").slice(-12);
}

export function whatsappMsisdnRateLimit(req: Request, res: Response, next: NextFunction): void {
  const from =
    (typeof req.body?.from === "string" && req.body.from) ||
    extractMetaFrom(req.body)?.from;

  if (!from) {
    next();
    return;
  }

  const key = keyForMsisdn(from);
  const now = Date.now();
  const bucket = hits.get(key);

  if (!bucket || bucket.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (bucket.count >= MAX_PER_MSISDN) {
    res.status(429).json({ message: "Too many WhatsApp messages from this number. Please wait a moment." });
    return;
  }

  bucket.count += 1;
  next();
}

function extractMetaFrom(body: unknown): { from?: string } | null {
  if (!body || typeof body !== "object") return null;
  const entry = (body as { entry?: Array<{ changes?: Array<{ value?: { messages?: Array<{ from?: string }> } }> }> }).entry;
  const from = entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
  return from ? { from } : null;
}
