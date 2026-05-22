/**
 * Verify noreply@ SMTP (Register Domain / cPanel).
 *
 * Usage (from repo root):
 *   Set vars in apps/api/.env or export them, then:
 *   npm run test:smtp
 *   npm run test:smtp -- --send-to you@example.com
 */
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

dotenv.config();
dotenv.config({ path: path.join(root, "apps/api/.env") });

const host = process.env.SMTP_HOST ?? "mail.brand2school.co.za";
const port = Number(process.env.SMTP_PORT ?? "465");
const secure = String(process.env.SMTP_SECURE ?? "true").toLowerCase() === "true";
const user = process.env.SMTP_USER ?? "noreply@brand2school.co.za";
const pass = process.env.SMTP_PASS ?? "";
const from = process.env.MAIL_FROM ?? "noreply@brand2school.co.za";

const sendTo = process.argv.includes("--send-to")
  ? process.argv[process.argv.indexOf("--send-to") + 1]
  : null;

if (!pass) {
  console.error("\nMissing SMTP_PASS. Set it in apps/api/.env or your shell (never commit passwords).\n");
  process.exit(1);
}

const tx = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
  tls: { minVersion: "TLSv1.2" }
});

console.log("\nBrand2School SMTP test");
console.log(`  Host:   ${host}:${port} (secure=${secure})`);
console.log(`  User:   ${user}`);
console.log(`  From:   ${from}\n`);

try {
  await tx.verify();
  console.log("✓ SMTP connection verified\n");
} catch (err) {
  console.error("✗ SMTP verify failed:", err instanceof Error ? err.message : err);
  process.exit(1);
}

if (sendTo) {
  const info = await tx.sendMail({
    from: `"Brand2School" <${from}>`,
    to: sendTo,
    subject: "Brand2School — noreply SMTP test",
    text: "If you received this, noreply@brand2school.co.za is configured correctly for the API.",
    html: "<p>If you received this, <strong>noreply@brand2school.co.za</strong> is configured correctly for the API.</p>"
  });
  console.log(`✓ Test email sent to ${sendTo} (messageId: ${info.messageId})\n`);
} else {
  console.log("Add --send-to your@email.com to send a test message.\n");
}
