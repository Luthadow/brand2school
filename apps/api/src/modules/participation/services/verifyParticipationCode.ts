import { prisma } from "../../../lib/prisma.js";
import {
  isInvalidCodePattern,
  parseParticipationCode,
  verifyStoredChecksum,
  verifyStructuredChecksum
} from "../../../lib/participationCodes.js";
import { getCampaignCommercialBlockReason } from "../../commercial/commercialLiveCheck.js";

export type CodeVerificationResult =
  | {
      ok: true;
      code: {
        id: string;
        value: string;
        status: string;
        batchId: string;
        campaignId: string;
        brandId: string;
        productId: string | null;
        token: string | null;
        expiresAt: Date | null;
      };
      identity: {
        brandPrefix: string;
        campaignCode: string;
        batchCode: string;
      };
    }
  | {
      ok: false;
      outcome:
        | "INVALID_PATTERN"
        | "INVALID_STRUCTURE"
        | "CHECKSUM_FAILED"
        | "BRAND_NOT_FOUND"
        | "CAMPAIGN_NOT_FOUND"
        | "NOT_FOUND"
        | "DUPLICATE"
        | "EXPIRED"
        | "CAMPAIGN_MISMATCH"
        | "CAMPAIGN_INACTIVE"
        | "CAMPAIGN_WINDOW";
      message: string;
    };

export async function verifyParticipationCode(
  productCode: string,
  campaignSlug: string,
  now = new Date()
): Promise<CodeVerificationResult> {
  const normalized = productCode.trim().toUpperCase();

  if (isInvalidCodePattern(normalized)) {
    return {
      ok: false,
      outcome: "INVALID_PATTERN",
      message: "This code format is not valid. Check the code on your product packaging."
    };
  }

  const parsed = parseParticipationCode(normalized);
  if (!parsed) {
    return {
      ok: false,
      outcome: "INVALID_STRUCTURE",
      message: "Code structure is not recognized."
    };
  }

  if (parsed.format === "structured") {
    const parts = parsed.parts;
    if (!verifyStructuredChecksum(parts)) {
      return {
        ok: false,
        outcome: "CHECKSUM_FAILED",
        message: "Code failed integrity verification. The checksum does not match."
      };
    }

    const brand = await prisma.brand.findUnique({ where: { codePrefix: parts.brandPrefix } });
    if (!brand) {
      return {
        ok: false,
        outcome: "BRAND_NOT_FOUND",
        message: "Brand namespace not recognized for this code."
      };
    }

    const campaignBySlug = await prisma.campaign.findUnique({
      where: { slug: campaignSlug.toLowerCase() },
      include: { brand: true }
    });
    if (!campaignBySlug || !campaignBySlug.isActive) {
      return { ok: false, outcome: "CAMPAIGN_INACTIVE", message: "Campaign not active." };
    }
    const commercialBlock = await getCampaignCommercialBlockReason(campaignBySlug.id);
    if (commercialBlock) {
      return { ok: false, outcome: "CAMPAIGN_INACTIVE", message: commercialBlock };
    }
    if (now < campaignBySlug.startsAt || now > campaignBySlug.endsAt) {
      return { ok: false, outcome: "CAMPAIGN_WINDOW", message: "Campaign outside active window." };
    }

    const campaignByCode = await prisma.campaign.findUnique({
      where: { brandId_campaignCode: { brandId: brand.id, campaignCode: parts.campaignCode } }
    });
    if (!campaignByCode) {
      return {
        ok: false,
        outcome: "CAMPAIGN_NOT_FOUND",
        message: "Campaign segment does not match a registered campaign for this brand."
      };
    }

    if (campaignByCode.id !== campaignBySlug.id) {
      return {
        ok: false,
        outcome: "CAMPAIGN_MISMATCH",
        message: "Code campaign does not match the campaign you are submitting to."
      };
    }

    const code = await prisma.code.findFirst({
      where: {
        value: parts.fullValue,
        brandId: brand.id,
        campaignId: campaignByCode.id,
        token: parts.token
      },
      include: { batch: true }
    });

    if (!code) {
      return {
        ok: false,
        outcome: "NOT_FOUND",
        message: "Code not found in inventory. It may be invalid or not yet issued."
      };
    }

    if (!verifyStoredChecksum(code.value, code.checksum)) {
      return {
        ok: false,
        outcome: "CHECKSUM_FAILED",
        message: "Code failed database integrity verification."
      };
    }

    if (code.batch.batchCode !== parts.batchCode) {
      return {
        ok: false,
        outcome: "NOT_FOUND",
        message: "Batch segment does not match issued inventory."
      };
    }

    if (code.batch.expiresAt && code.batch.expiresAt < now) {
      if (code.status === "UNUSED") {
        await prisma.code.update({ where: { id: code.id }, data: { status: "EXPIRED" } });
      }
      return { ok: false, outcome: "EXPIRED", message: "Code expired." };
    }

    if (code.status !== "UNUSED") {
      return {
        ok: false,
        outcome: "DUPLICATE",
        message: "This code has already been used. Each code can only be submitted once."
      };
    }

    return {
      ok: true,
      code: {
        id: code.id,
        value: code.value,
        status: code.status,
        batchId: code.batchId,
        campaignId: campaignByCode.id,
        brandId: brand.id,
        productId: code.productId,
        token: code.token,
        expiresAt: code.batch.expiresAt
      },
      identity: {
        brandPrefix: parts.brandPrefix,
        campaignCode: parts.campaignCode,
        batchCode: parts.batchCode
      }
    };
  }

  // Legacy compact codes (pre-structured inventory)
  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignSlug.toLowerCase() } });
  if (!campaign || !campaign.isActive) {
    return { ok: false, outcome: "CAMPAIGN_INACTIVE", message: "Campaign not active." };
  }
  const commercialBlock = await getCampaignCommercialBlockReason(campaign.id);
  if (commercialBlock) {
    return { ok: false, outcome: "CAMPAIGN_INACTIVE", message: commercialBlock };
  }
  if (now < campaign.startsAt || now > campaign.endsAt) {
    return { ok: false, outcome: "CAMPAIGN_WINDOW", message: "Campaign outside active window." };
  }

  const code = await prisma.code.findUnique({
    where: { value: parsed.value },
    include: { batch: true, brand: true }
  });

  if (!code) {
    return {
      ok: false,
      outcome: "NOT_FOUND",
      message: "Code not found. It may be invalid or not part of this campaign."
    };
  }

  if (!verifyStoredChecksum(code.value, code.checksum)) {
    return {
      ok: false,
      outcome: "CHECKSUM_FAILED",
      message: "Code failed integrity verification."
    };
  }

  if (code.batch.campaignId !== campaign.id) {
    return {
      ok: false,
      outcome: "CAMPAIGN_MISMATCH",
      message: "Code does not belong to this campaign."
    };
  }

  if (code.batch.expiresAt && code.batch.expiresAt < now) {
    if (code.status === "UNUSED") {
      await prisma.code.update({ where: { id: code.id }, data: { status: "EXPIRED" } });
    }
    return { ok: false, outcome: "EXPIRED", message: "Code expired." };
  }

  if (code.status !== "UNUSED") {
    return {
      ok: false,
      outcome: "DUPLICATE",
      message: "This code has already been used. Each code can only be submitted once."
    };
  }

  const brandPrefix = code.brand?.codePrefix ?? "LEGACY";
  const campaignCode = campaign.campaignCode;

  return {
    ok: true,
    code: {
      id: code.id,
      value: code.value,
      status: code.status,
      batchId: code.batchId,
      campaignId: campaign.id,
      brandId: code.brandId ?? campaign.brandId,
      productId: code.productId,
      token: code.token,
      expiresAt: code.batch.expiresAt
    },
    identity: {
      brandPrefix,
      campaignCode,
      batchCode: code.batch.batchCode
    }
  };
}
