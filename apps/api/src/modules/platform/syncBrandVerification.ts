import type { BrandVerificationStatus, EntityStatus, Prisma } from "../../generated/prisma/index.js";
import { ensureBrandVerificationCode } from "../../lib/brandVerificationCode.js";

type BrandRow = {
  id: string;
  codePrefix: string;
  founderExempt: boolean;
  verificationStatus: BrandVerificationStatus;
  verificationCode: string | null;
  status?: EntityStatus;
};

const TRUSTED = new Set<BrandVerificationStatus>(["VERIFIED", "FOUNDER_VERIFIED"]);

export function verificationStatusForEntityChange(
  entityStatus: EntityStatus,
  founderExempt: boolean,
  current: BrandVerificationStatus
): BrandVerificationStatus {
  if (entityStatus === "SUSPENDED") return "SUSPENDED";
  if (current === "REJECTED") return "REJECTED";
  if (entityStatus === "PENDING") return "PENDING";
  if (current === "FOUNDER_VERIFIED" && ["ACTIVE", "APPROVED", "VERIFIED"].includes(entityStatus)) {
    return "FOUNDER_VERIFIED";
  }
  if (founderExempt && ["ACTIVE", "APPROVED", "VERIFIED"].includes(entityStatus)) {
    return "FOUNDER_VERIFIED";
  }
  if (["ACTIVE", "APPROVED", "VERIFIED"].includes(entityStatus)) {
    return "VERIFIED";
  }
  return current;
}

function resolveTrustTimestamps(verificationStatus: BrandVerificationStatus): {
  verifiedAt: Date | null;
  clearVerifier: boolean;
} {
  if (TRUSTED.has(verificationStatus)) {
    return { verifiedAt: new Date(), clearVerifier: false };
  }
  return { verifiedAt: null, clearVerifier: true };
}

async function persistBrandVerification(
  prisma: Prisma.TransactionClient | Prisma.DefaultPrismaClient,
  brand: BrandRow,
  verificationStatus: BrandVerificationStatus,
  approvedByUserId?: string
): Promise<{ verificationCode: string | null; verificationStatus: BrandVerificationStatus }> {
  let verificationCode = brand.verificationCode;
  if (TRUSTED.has(verificationStatus)) {
    verificationCode = await ensureBrandVerificationCode(prisma, brand.id, brand.codePrefix);
  }

  const { verifiedAt, clearVerifier } = resolveTrustTimestamps(verificationStatus);

  await prisma.brand.update({
    where: { id: brand.id },
    data: {
      verificationStatus,
      verificationCode,
      verifiedAt,
      ...(approvedByUserId && TRUSTED.has(verificationStatus)
        ? { verifiedByUserId: approvedByUserId }
        : {}),
      ...(clearVerifier ? { verifiedByUserId: null } : {})
    }
  });

  return { verificationCode, verificationStatus };
}

/** Sync trust layer when admin changes operational EntityStatus (approvals). */
export async function applyBrandVerificationSideEffects(
  prisma: Prisma.TransactionClient | Prisma.DefaultPrismaClient,
  brand: BrandRow,
  entityStatus: EntityStatus,
  approvedByUserId?: string
): Promise<{ verificationCode: string | null; verificationStatus: BrandVerificationStatus }> {
  const verificationStatus = verificationStatusForEntityChange(
    entityStatus,
    brand.founderExempt,
    brand.verificationStatus
  );
  return persistBrandVerification(prisma, brand, verificationStatus, approvedByUserId);
}

/** Sync trust layer when admin PATCHes verificationStatus / founderExempt on brand profile. */
export async function applyManualBrandVerificationPatch(
  prisma: Prisma.TransactionClient | Prisma.DefaultPrismaClient,
  brandId: string,
  patch: {
    verificationStatus?: BrandVerificationStatus;
    founderExempt?: boolean;
  },
  approvedByUserId?: string
): Promise<{ verificationCode: string | null; verificationStatus: BrandVerificationStatus } | null> {
  if (patch.verificationStatus === undefined && patch.founderExempt === undefined) {
    return null;
  }

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: {
      id: true,
      codePrefix: true,
      founderExempt: true,
      verificationStatus: true,
      verificationCode: true,
      status: true
    }
  });
  if (!brand) return null;

  const founderExempt = patch.founderExempt ?? brand.founderExempt;
  let verificationStatus = patch.verificationStatus ?? brand.verificationStatus;

  if (patch.founderExempt === true && TRUSTED.has(verificationStatus) === false) {
    if (["ACTIVE", "APPROVED", "VERIFIED"].includes(brand.status)) {
      verificationStatus = "FOUNDER_VERIFIED";
    }
  }

  if (
    patch.verificationStatus === undefined &&
    patch.founderExempt === true &&
    ["ACTIVE", "APPROVED", "VERIFIED"].includes(brand.status)
  ) {
    verificationStatus = "FOUNDER_VERIFIED";
  }

  return persistBrandVerification(
    prisma,
    { ...brand, founderExempt },
    verificationStatus,
    approvedByUserId
  );
}
