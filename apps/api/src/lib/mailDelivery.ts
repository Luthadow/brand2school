import type nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { isResendConfigured, sendViaResend, type ResendAttachment } from "./resend.js";
import { getMailTransporter, isSmtpConfigured } from "./smtp.js";

export type MailDeliveryMode = "resend" | "smtp" | "none";

export type DeliverMailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  attachments?: nodemailer.SendMailOptions["attachments"];
};

function nodemailerAttachmentsToResend(
  attachments?: nodemailer.SendMailOptions["attachments"]
): ResendAttachment[] | undefined {
  if (!attachments?.length) return undefined;

  const out: ResendAttachment[] = [];
  for (const item of attachments) {
    if (!item || typeof item === "string") continue;
    const filename =
      typeof item.filename === "string" ? item.filename : "attachment.bin";
    let content: Buffer | undefined;
    if (Buffer.isBuffer(item.content)) {
      content = item.content;
    } else if (typeof item.content === "string") {
      content = Buffer.from(item.content, "utf8");
    }
    if (!content) continue;
    out.push({
      filename,
      content,
      contentType: typeof item.contentType === "string" ? item.contentType : undefined
    });
  }

  return out.length > 0 ? out : undefined;
}

export function getMailDeliveryMode(): MailDeliveryMode {
  if (isResendConfigured()) return "resend";
  if (isSmtpConfigured()) return "smtp";
  return "none";
}

export function isMailConfigured(): boolean {
  return getMailDeliveryMode() !== "none";
}

export function railwaySmtpBlockedHint(errorMessage: string): string | undefined {
  const lower = errorMessage.toLowerCase();
  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("econnrefused") ||
    lower.includes("etimedout") ||
    lower.includes("connect")
  ) {
    return (
      "Railway Free/Hobby plans block outbound SMTP (ports 465/587). " +
      "Set RESEND_API_KEY on the API service (HTTPS, works on all plans) or upgrade to Railway Pro and redeploy."
    );
  }
  return undefined;
}

export async function deliverMail(input: DeliverMailInput): Promise<void> {
  const mode = getMailDeliveryMode();

  if (mode === "resend") {
    await sendViaResend({
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
      attachments: nodemailerAttachmentsToResend(input.attachments)
    });
    return;
  }

  if (mode === "smtp") {
    const tx = getMailTransporter();
    if (!tx) {
      throw new Error("SMTP transporter could not be created.");
    }

    try {
      await tx.sendMail({
        from: `"Brand2School" <${env.MAIL_FROM}>`,
        to: input.to,
        replyTo: input.replyTo,
        subject: input.subject,
        text: input.text,
        html: input.html,
        attachments: input.attachments
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "SMTP send failed";
      const hint = railwaySmtpBlockedHint(message);
      throw new Error(hint ? `${message}. ${hint}` : message);
    }
    return;
  }

  if (env.NODE_ENV === "production") {
    throw new Error(
      "Email is not configured. Set RESEND_API_KEY (recommended on Railway Hobby) or SMTP_HOST, SMTP_USER, and SMTP_PASS."
    );
  }

  console.info("[mail:dev]", input.subject);
  console.info(`To: ${input.to}`);
  if (input.replyTo) console.info(`Reply-To: ${input.replyTo}`);
  console.info(input.text);
}
