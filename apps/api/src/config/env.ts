import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("4000"),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  WEB_APP_URL: z.string().url().default("http://localhost:3000"),
  ADMIN_WEB_APP_URL: z.string().url().default("http://localhost:3001"),
  MAIL_FROM: z.string().email().default("noreply@brand2school.co.za"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  INTERNAL_API_KEY: z.string().min(16).optional(),
  WHATSAPP_APP_SECRET: z.string().min(8).optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().min(8).optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().min(8).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(4).optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  PASSWORD_RESET_EXPIRES_MINUTES: z.coerce.number().int().min(15).max(1440).default(30),
  PASSWORD_RESET_MAX_PER_HOUR: z.coerce.number().int().min(1).max(20).default(5),
  NOTIFICATION_DELIVERY: z.enum(["sync", "queue"]).default("queue"),
  NOTIFICATION_BATCH_SIZE: z.coerce.number().int().min(1).max(100).default(25),
  NOTIFICATION_POLL_MS: z.coerce.number().int().min(500).default(3000),
  /** Comma-separated extra admin inboxes for registration alerts (optional). */
  ADMIN_NOTIFY_EMAILS: z.string().optional(),
  /** Public HTTPS base for brand logos and uploads (e.g. https://api.brand2school.co.za). */
  API_PUBLIC_URL: z.string().url().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

export const env = parsed.data;

type ProductionCheck = { key: string; ok: boolean; detail: string };

export function productionReadinessChecks(): ProductionCheck[] {
  const isProd = env.NODE_ENV === "production";
  if (!isProd) return [];

  return [
    {
      key: "WHATSAPP_ACCESS_TOKEN",
      ok: Boolean(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID),
      detail: "Outbound WhatsApp requires WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID."
    },
    {
      key: "WHATSAPP_WEBHOOK",
      ok: Boolean(env.WHATSAPP_APP_SECRET && env.WHATSAPP_WEBHOOK_VERIFY_TOKEN),
      detail: "Inbound WhatsApp webhook requires WHATSAPP_APP_SECRET and WHATSAPP_WEBHOOK_VERIFY_TOKEN."
    },
    {
      key: "SMTP_HOST",
      ok: Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
      detail: "Transactional email requires SMTP_HOST, SMTP_USER, and SMTP_PASS (noreply@brand2school.co.za)."
    },
    {
      key: "INTERNAL_API_KEY",
      ok: Boolean(env.INTERNAL_API_KEY),
      detail: "Server-to-server analytics requires INTERNAL_API_KEY."
    },
    {
      key: "API_PUBLIC_URL",
      ok: Boolean(process.env.API_PUBLIC_URL?.trim()),
      detail:
        "Brand logos on the public site require API_PUBLIC_URL (e.g. https://api.brand2school.co.za)."
    }
  ];
}

/** Logs missing optional integrations; does not block API boot (healthcheck / core routes). */
export function logProductionReadinessWarnings(): void {
  const failures = productionReadinessChecks().filter((check) => !check.ok);
  if (failures.length === 0) return;

  for (const failure of failures) {
    console.warn(`[production-readiness] ${failure.key}: ${failure.detail}`);
  }
}
