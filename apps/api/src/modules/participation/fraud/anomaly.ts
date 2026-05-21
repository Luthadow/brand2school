import type { Prisma } from "../../../generated/prisma/index.js";
import { prisma } from "../../../lib/prisma.js";

const HOURLY_SCHOOL_FREEZE_THRESHOLD = Number(process.env.FRAUD_SCHOOL_HOURLY_FREEZE ?? "500");

export type SchoolFraudFreezePayload = {
  reason: string;
  [key: string]: unknown;
};

/** Suspend school for automated fraud review; idempotent if already suspended. */
export async function freezeSchoolForFraudReview(
  schoolId: string,
  payload: SchoolFraudFreezePayload
): Promise<boolean> {
  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { status: true } });
  if (!school) return false;
  if (school.status === "SUSPENDED") return true;

  await prisma.$transaction([
    prisma.school.update({
      where: { id: schoolId },
      data: { status: "SUSPENDED" }
    }),
    prisma.auditLog.create({
      data: {
        action: "SCHOOL_AUTO_FROZEN",
        targetType: "school",
        targetId: schoolId,
        payload: payload as Prisma.InputJsonValue
      }
    })
  ]);

  return true;
}

export async function enforceSchoolAnomalyFreeze(schoolId: string, now: Date): Promise<boolean> {
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const hourlyCount = await prisma.submission.count({
    where: { schoolId, createdAt: { gte: oneHourAgo } }
  });

  if (hourlyCount < HOURLY_SCHOOL_FREEZE_THRESHOLD) {
    return false;
  }

  return freezeSchoolForFraudReview(schoolId, {
    reason: "ANOMALY_VELOCITY",
    hourlySubmissions: hourlyCount,
    threshold: HOURLY_SCHOOL_FREEZE_THRESHOLD
  });
}
