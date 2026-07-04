import { prisma } from "../../../lib/prisma.js";
import type { EntityStatus } from "../../../generated/prisma/index.js";

/** Full approval (APPROVED/ACTIVE) requires a reviewed verification packet. */
const GATED_STATUSES: EntityStatus[] = ["APPROVED", "ACTIVE"];

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
        "Verification documents must be approved before advancing to APPROVED or ACTIVE. Review the packet on the verification screen (admin can approve provisionally if documents are not yet submitted).",
      verificationStatus: verification?.status ?? "NOT_SUBMITTED"
    };
  }
  return { ok: true };
}
