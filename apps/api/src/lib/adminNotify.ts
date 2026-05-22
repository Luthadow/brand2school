import { prisma } from "./prisma.js";
import { INTERNAL_CONTACT } from "./contacts.js";
import { sendBrandedMail } from "./mail.js";
import { env } from "../config/env.js";

function parseAdminNotifyEnv(): string[] {
  const raw = env.ADMIN_NOTIFY_EMAILS;
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;]/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));
}

/** Distinct admin inboxes for registration and verification alerts. */
export async function getAdminNotifyEmails(): Promise<string[]> {
  const emails = new Set<string>([
    INTERNAL_CONTACT.admin.toLowerCase(),
    INTERNAL_CONTACT.superadmin.toLowerCase(),
    ...parseAdminNotifyEnv()
  ]);

  const staff = await prisma.user.findMany({
    where: {
      role: { in: ["SUPER_ADMIN", "ADMIN_STAFF"] },
      status: "ACTIVE"
    },
    select: { email: true }
  });
  for (const row of staff) {
    emails.add(row.email.trim().toLowerCase());
  }

  return [...emails];
}

export function adminSchoolReviewUrl(schoolId: string): string {
  const base = env.ADMIN_WEB_APP_URL.replace(/\/$/, "");
  return `${base}/dashboard/schools/${schoolId}/verification`;
}

export function adminBrandReviewUrl(brandId: string): string {
  const base = env.ADMIN_WEB_APP_URL.replace(/\/$/, "");
  return `${base}/dashboard/commercial?brandId=${encodeURIComponent(brandId)}`;
}

export function adminApprovalsUrl(): string {
  const base = env.ADMIN_WEB_APP_URL.replace(/\/$/, "");
  return `${base}/dashboard/approvals`;
}

/** Send the same ops email to every configured admin recipient. */
export async function notifyAdminsByEmail(input: {
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}): Promise<{ sent: number; failed: number }> {
  const recipients = await getAdminNotifyEmails();
  if (recipients.length === 0) {
    console.warn("[mail] No admin notify recipients configured.");
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  await Promise.all(
    recipients.map(async (to) => {
      try {
        await sendBrandedMail({
          to,
          subject: input.subject,
          text: input.text,
          html: input.html,
          replyTo: input.replyTo
        });
        sent += 1;
      } catch (err) {
        failed += 1;
        console.error(`[mail] Admin notify failed for ${to}:`, err);
      }
    })
  );
  return { sent, failed };
}
