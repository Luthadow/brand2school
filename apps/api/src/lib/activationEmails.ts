import { env } from "../config/env.js";
import { prisma } from "./prisma.js";
import { logger } from "./logger.js";
import { queueEmail, queueEmails, type QueueEmailInput } from "./notifications/dispatch.js";

const SCHOOL_NOTIFY_STATUSES = new Set(["APPROVED", "ACTIVE"]);
const BRAND_NOTIFY_STATUS = "ACTIVE";

type StatusSnapshot = { id: string; previousStatus: string };

export async function notifySchoolActivatedIfNeeded(
  schoolId: string,
  previousStatus: string
): Promise<void> {
  const input = await buildSchoolActivationEmail(schoolId, previousStatus);
  if (!input) return;
  await queueEmail({ ...input, priority: 2, immediate: true });
}

export async function notifyBrandActivatedIfNeeded(brandId: string, previousStatus: string): Promise<void> {
  const inputs = await buildBrandActivationEmails(brandId, previousStatus);
  if (inputs.length === 0) return;
  for (const input of inputs) {
    await queueEmail({ ...input, priority: 2, immediate: true });
  }
}

export async function queueSchoolActivationsFromSnapshots(snapshots: StatusSnapshot[]): Promise<number> {
  const inputs: QueueEmailInput<"SCHOOL_APPROVED">[] = [];
  for (const snap of snapshots) {
    const built = await buildSchoolActivationEmail(snap.id, snap.previousStatus);
    if (built) inputs.push({ ...built, priority: 2 });
  }
  return queueEmails(inputs);
}

export async function queueBrandActivationsFromSnapshots(snapshots: StatusSnapshot[]): Promise<number> {
  const inputs: QueueEmailInput<"BRAND_WELCOME">[] = [];
  for (const snap of snapshots) {
    const built = await buildBrandActivationEmails(snap.id, snap.previousStatus);
    inputs.push(...built.map((item) => ({ ...item, priority: 2 })));
  }
  return queueEmails(inputs);
}

async function buildSchoolActivationEmail(
  schoolId: string,
  previousStatus: string
): Promise<QueueEmailInput<"SCHOOL_APPROVED"> | null> {
  if (SCHOOL_NOTIFY_STATUSES.has(previousStatus)) return null;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { adminUser: { select: { email: true } } }
  });
  if (!school || !SCHOOL_NOTIFY_STATUSES.has(school.status)) return null;

  const to = school.contactEmail ?? school.adminUser?.email;
  if (!to) {
    logger.warn({ schoolId }, "School activated but no email address for notification");
    return null;
  }

  return {
    template: "SCHOOL_APPROVED",
    recipient: to,
    entityType: "SCHOOL",
    entityId: schoolId,
    payload: {
      principalName: school.principalName,
      schoolName: school.name,
      schoolCode: school.schoolCode,
      whatsappPhone: school.whatsappPhone,
      loginUrl: `${env.WEB_APP_URL}/school/login`
    }
  };
}

async function buildBrandActivationEmails(
  brandId: string,
  previousStatus: string
): Promise<QueueEmailInput<"BRAND_WELCOME">[]> {
  if (previousStatus === BRAND_NOTIFY_STATUS) return [];

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      users: {
        where: { role: "BRAND_ADMIN" },
        select: { email: true, fullName: true }
      }
    }
  });
  if (!brand || brand.status !== BRAND_NOTIFY_STATUS) return [];

  const loginUrl = `${env.WEB_APP_URL}/brand/login`;
  const recipients = brand.users.filter((u) => u.email);
  if (recipients.length === 0) {
    logger.warn({ brandId }, "Brand activated but no BRAND_ADMIN email recipients");
    return [];
  }

  return recipients.map((user) => ({
    template: "BRAND_WELCOME",
    recipient: user.email,
    entityType: "BRAND",
    entityId: brandId,
    payload: {
      contactName: user.fullName,
      brandName: brand.name,
      loginUrl
    }
  }));
}
