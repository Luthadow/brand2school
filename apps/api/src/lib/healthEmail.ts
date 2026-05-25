import { env } from "../config/env.js";
import { deliverMail, getMailDeliveryMode, isMailConfigured } from "./mailDelivery.js";
import { isResendConfigured, sendViaResend, verifyResendApiKey } from "./resend.js";
import { isSmtpConfigured, sendSmtpTestEmail, verifySmtpConnection } from "./smtp.js";

export async function getEmailHealthStatus(): Promise<{
  configured: boolean;
  verified: boolean | null;
  transport: string;
  mailFrom: string;
  notificationDelivery: string;
  error?: string;
  hint?: string;
}> {
  const transport = getMailDeliveryMode();
  const base = {
    configured: isMailConfigured(),
    verified: null as boolean | null,
    transport,
    mailFrom: env.MAIL_FROM,
    notificationDelivery: env.NOTIFICATION_DELIVERY
  };

  if (!base.configured) {
    return {
      ...base,
      error: "Set RESEND_API_KEY (Railway Hobby) or SMTP_HOST + SMTP_USER + SMTP_PASS (Railway Pro+).",
      hint:
        "Railway Hobby blocks outbound SMTP even when variables are set. Use Resend or upgrade to Pro."
    };
  }

  if (transport === "resend") {
    const result = await verifyResendApiKey();
    return {
      ...base,
      verified: result.ok,
      ...(result.error ? { error: result.error } : {}),
      hint: result.ok
        ? undefined
        : "Verify brand2school.co.za in Resend and use a valid API key."
    };
  }

  const result = await verifySmtpConnection();
  return {
    ...base,
    verified: result.ok,
    ...(result.error ? { error: result.error } : {}),
    hint: result.ok
      ? undefined
      : "SMTP connection failed. On Railway Hobby, SMTP is blocked — set RESEND_API_KEY instead."
  };
}

export async function runMailVerifyAndOptionalSend(sendTo?: string): Promise<{
  configured: boolean;
  verified: boolean;
  transport: string;
  mailFrom: string;
  messageId?: string;
  sentTo?: string;
  error?: string;
  hint?: string;
}> {
  const transport = getMailDeliveryMode();

  if (!isMailConfigured()) {
    return {
      configured: false,
      verified: false,
      transport: "none",
      mailFrom: env.MAIL_FROM,
      error: "Email not configured on API.",
      hint: "Set RESEND_API_KEY or SMTP credentials on the brand2school API service."
    };
  }

  if (transport === "resend") {
    const result = await verifyResendApiKey();
    if (!result.ok) {
      return {
        configured: true,
        verified: false,
        transport,
        mailFrom: env.MAIL_FROM,
        error: result.error,
        hint: "Add and verify brand2school.co.za at https://resend.com/domains"
      };
    }

    if (!sendTo?.trim()) {
      return { configured: true, verified: true, transport, mailFrom: env.MAIL_FROM };
    }

    const sent = await sendViaResend({
      to: sendTo.trim(),
      subject: "Brand2School — email delivery test",
      text: "If you received this, Resend is configured correctly on the API.",
      html: "<p>If you received this, <strong>Resend</strong> is configured correctly on the API.</p>"
    });

    return {
      configured: true,
      verified: true,
      transport,
      mailFrom: env.MAIL_FROM,
      messageId: sent.id,
      sentTo: sendTo.trim()
    };
  }

  const result = await verifySmtpConnection(true);
  if (!result.ok) {
    return {
      configured: isSmtpConfigured(),
      verified: false,
      transport,
      mailFrom: env.MAIL_FROM,
      error: result.error,
      hint: "Railway Hobby blocks SMTP. Set RESEND_API_KEY or upgrade to Railway Pro and redeploy."
    };
  }

  if (!sendTo?.trim()) {
    return { configured: true, verified: true, transport, mailFrom: env.MAIL_FROM };
  }

  const { messageId } = await sendSmtpTestEmail(sendTo.trim());
  return {
    configured: true,
    verified: true,
    transport,
    mailFrom: env.MAIL_FROM,
    messageId,
    sentTo: sendTo.trim()
  };
}

/** Send test via active transport (Resend or SMTP). */
export async function sendMailDeliveryTest(to: string): Promise<{ messageId: string }> {
  if (isResendConfigured()) {
    const sent = await sendViaResend({
      to,
      subject: "Brand2School — email delivery test",
      text: "If you received this, email delivery is configured correctly on the API.",
      html: "<p>If you received this, email delivery is configured correctly on the API.</p>"
    });
    return { messageId: sent.id };
  }

  await deliverMail({
    to,
    subject: "Brand2School — email delivery test",
    text: "If you received this, email delivery is configured correctly on the API.",
    html: "<p>If you received this, email delivery is configured correctly on the API.</p>"
  });
  return { messageId: "smtp-sent" };
}
