import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let cachedTransporter: nodemailer.Transporter | null | undefined;
let lastVerify: { ok: boolean; at: number; error?: string } | null = null;

const VERIFY_CACHE_MS = 60_000;

export function isSmtpConfigured(): boolean {
  return Boolean(
    env.SMTP_HOST?.trim() && env.SMTP_USER?.trim() && env.SMTP_PASS && env.SMTP_PASS.length > 0
  );
}

export function getMailTransporter(): nodemailer.Transporter | null {
  if (!isSmtpConfigured()) return null;
  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER!, pass: env.SMTP_PASS! },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
    tls: { minVersion: "TLSv1.2" }
  });

  return cachedTransporter;
}

export async function verifySmtpConnection(force = false): Promise<{ ok: boolean; error?: string }> {
  const tx = getMailTransporter();
  if (!tx) {
    return {
      ok: false,
      error: "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS on the API service."
    };
  }

  const now = Date.now();
  if (!force && lastVerify && now - lastVerify.at < VERIFY_CACHE_MS) {
    return { ok: lastVerify.ok, error: lastVerify.error };
  }

  try {
    await tx.verify();
    lastVerify = { ok: true, at: now };
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMTP verify failed";
    lastVerify = { ok: false, at: now, error: message };
    return { ok: false, error: message };
  }
}

export async function sendSmtpTestEmail(to: string): Promise<{ messageId: string }> {
  const tx = getMailTransporter();
  if (!tx) {
    throw new Error("SMTP is not configured on the API service.");
  }

  const info = await tx.sendMail({
    from: `"Brand2School" <${env.MAIL_FROM}>`,
    to,
    subject: "Brand2School — noreply SMTP test",
    text: "If you received this, noreply@brand2school.co.za is configured correctly on the API.",
    html:
      "<p>If you received this, <strong>noreply@brand2school.co.za</strong> is configured correctly on the API.</p>"
  });

  return { messageId: info.messageId };
}
