import { env } from "../config/env.js";

export type ResendAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export function isResendConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY?.trim());
}

type ResendSendInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  attachments?: ResendAttachment[];
};

export async function sendViaResend(input: ResendSendInput): Promise<{ id: string }> {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set.");
  }

  const body: Record<string, unknown> = {
    from: `"Brand2School" <${env.MAIL_FROM}>`,
    to: [input.to],
    subject: input.subject,
    text: input.text,
    html: input.html
  };

  if (input.replyTo) {
    body.reply_to = input.replyTo;
  }

  if (input.attachments?.length) {
    body.attachments = input.attachments.map((a) => ({
      filename: a.filename,
      content: a.content.toString("base64"),
      content_type: a.contentType ?? "application/octet-stream"
    }));
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };

  if (!res.ok) {
    const detail = data.message ?? res.statusText;
    throw new Error(`Resend API error (${res.status}): ${detail}`);
  }

  return { id: data.id ?? "unknown" };
}

/** Lightweight check that the API key is accepted (no email sent). */
export async function verifyResendApiKey(): Promise<{ ok: boolean; error?: string }> {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not set." };
  }

  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "Resend API key is invalid." };
    }
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      return { ok: false, error: data.message ?? `Resend API returned ${res.status}` };
    }
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resend verify failed";
    return { ok: false, error: message };
  }
}
