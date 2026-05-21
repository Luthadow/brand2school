import { prisma } from "../../../lib/prisma.js";
import type { EntityStatus } from "../../../generated/prisma/index.js";

const GATED_STATUSES: EntityStatus[] = ["VERIFIED", "APPROVED", "ACTIVE"];

export function schoolStatusRequiresVerificationApproval(target: EntityStatus): boolean {
  return GATED_STATUSES.includes(target);
}

export async function getOrCreateSchoolVerification(schoolId: string) {
  const existing = await prisma.schoolVerification.findUnique({ where: { schoolId } });
  if (existing) return existing;
  return prisma.schoolVerification.create({
    data: { schoolId, status: "NOT_SUBMITTED" }
  });
}

export async function assertSchoolVerificationApproved(
  schoolId: string
): Promise<{ ok: true } | { ok: false; message: string; verificationStatus: string }> {
  const verification = await prisma.schoolVerification.findUnique({ where: { schoolId } });
  if (!verification || verification.status !== "APPROVED") {
    return {
      ok: false,
      message:
        "School EMIS verification packet must be approved before advancing entity status. Review documents on the verification screen.",
      verificationStatus: verification?.status ?? "NOT_SUBMITTED"
    };
  }
  return { ok: true };
}
