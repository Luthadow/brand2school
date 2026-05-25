import type { PrismaClient } from "../generated/prisma/index.js";
import {
  applyBrandVerificationSideEffects,
  verificationStatusForEntityChange
} from "../modules/platform/syncBrandVerification.js";

const TRUSTED = new Set(["VERIFIED", "FOUNDER_VERIFIED"]);

export type BackfillBrandVerificationResult = {
  scanned: number;
  statusAligned: number;
  codesIssued: number;
  verifiedAtSet: number;
};

/**
 * Aligns verificationStatus / codes / verifiedAt for brands created before or without full trust wiring.
 * Safe to run multiple times (idempotent).
 */
export async function backfillBrandVerification(
  prisma: PrismaClient
): Promise<BackfillBrandVerificationResult> {
  const brands = await prisma.brand.findMany({
    select: {
      id: true,
      codePrefix: true,
      status: true,
      founderExempt: true,
      verificationStatus: true,
      verificationCode: true,
      verifiedAt: true
    }
  });

  let statusAligned = 0;
  let codesIssued = 0;
  let verifiedAtSet = 0;

  for (const brand of brands) {
    const targetStatus = verificationStatusForEntityChange(
      brand.status,
      brand.founderExempt,
      brand.verificationStatus
    );

    if (targetStatus !== brand.verificationStatus) {
      statusAligned += 1;
    }

    const result = await applyBrandVerificationSideEffects(
      prisma,
      {
        id: brand.id,
        codePrefix: brand.codePrefix,
        founderExempt: brand.founderExempt,
        verificationStatus: brand.verificationStatus,
        verificationCode: brand.verificationCode
      },
      brand.status
    );

    if (!brand.verificationCode && result.verificationCode) {
      codesIssued += 1;
    }

    if (TRUSTED.has(result.verificationStatus) && !brand.verifiedAt) {
      verifiedAtSet += 1;
    }
  }

  return {
    scanned: brands.length,
    statusAligned,
    codesIssued,
    verifiedAtSet
  };
}
