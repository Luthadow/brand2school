import { env } from "../config/env.js";
import { getMailDeliveryMode, isMailConfigured } from "./mailDelivery.js";
import { logger } from "./logger.js";
import { verifyResendApiKey } from "./resend.js";
import { verifySmtpConnection } from "./smtp.js";

export async function verifyMailOnStartup(): Promise<void> {
  if (!isMailConfigured()) {
    if (env.NODE_ENV === "production") {
      logger.error(
        { mailFrom: env.MAIL_FROM },
        "Email not configured on API — set RESEND_API_KEY (Hobby) or SMTP_* (Pro+), then redeploy."
      );
    }
    return;
  }

  const mode = getMailDeliveryMode();

  if (mode === "resend") {
    const result = await verifyResendApiKey();
    if (result.ok) {
      logger.info({ mailFrom: env.MAIL_FROM, transport: "resend" }, "Resend API verified for noreply mail");
      return;
    }
    logger.error(
      { err: result.error, transport: "resend" },
      "Resend verify failed — check RESEND_API_KEY and domain verification"
    );
    return;
  }

  const result = await verifySmtpConnection(true);
  if (result.ok) {
    logger.info(
      { host: env.SMTP_HOST, port: env.SMTP_PORT, user: env.SMTP_USER, mailFrom: env.MAIL_FROM },
      "SMTP connection verified for noreply mail"
    );
    return;
  }

  logger.error(
    {
      err: result.error,
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      transport: "smtp"
    },
    "SMTP verify failed — on Railway Hobby outbound SMTP is blocked; use RESEND_API_KEY instead"
  );
}
