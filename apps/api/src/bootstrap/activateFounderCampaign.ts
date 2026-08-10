import type { PrismaClient } from "../generated/prisma/index.js";
import { generateSecureCodeBatch } from "../modules/codes/generateBatch.js";
import { generateSecureCodeBatchPacks } from "../modules/codes/generateBatchPacks.js";
import { isAllowedContributionPerCodeZar } from "../modules/funding/contributionPerCode.js";
import { FOUNDER_BRAND_SLUG } from "./bootstrapFounderBrand.js";
import { MAGOME_BRAND_SLUG, MAGOME_CAMPAIGN_TARGET } from "./bootstrapMagomeBrand.js";

const FOUNDER_STARTER_CODE_COUNT = 100;

/** Founder campaigns must be live on /submit — waive commercial gates and seed codes if needed. */
export async function ensureFounderCampaignParticipationReady(
  prisma: PrismaClient,
  brandId: string,
  campaignId: string
): Promise<{ activated: boolean; codesSeeded: number }> {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { founderExempt: true, slug: true, status: true }
  });
  if (!brand?.founderExempt && brand?.slug !== FOUNDER_BRAND_SLUG) {
    return { activated: false, codesSeeded: 0 };
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { _count: { select: { codes: true } } }
  });
  if (!campaign || campaign.brandId !== brandId) {
    return { activated: false, codesSeeded: 0 };
  }

  let codesSeeded = 0;
  if (campaign._count.codes === 0) {
    if (brand.slug === MAGOME_BRAND_SLUG) {
      const packs = await generateSecureCodeBatchPacks({
        campaignId,
        quantity: MAGOME_CAMPAIGN_TARGET,
        batchNamePrefix: "Magome pilot codes"
      });
      codesSeeded = packs.generatedCount;
    } else {
      const batch = await generateSecureCodeBatch({
        campaignId,
        batchName: "Founder launch codes",
        count: FOUNDER_STARTER_CODE_COUNT
      });
      codesSeeded = batch.generatedCount;
      await prisma.codeBatch.update({
        where: { id: batch.batchId },
        data: { status: "AVAILABLE", source: "GENERATE" }
      });
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { codeMode: "GENERATE" }
      });
    }
  }

  const contributionZar = Number(campaign.contributionPerCodeZar ?? 0);
  /** Magome brand admin must choose R2 / R5 / R10 before the campaign goes LIVE. */
  const magomeAwaitingContribution =
    brand.slug === MAGOME_BRAND_SLUG && !isAllowedContributionPerCodeZar(contributionZar);

  if (magomeAwaitingContribution) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        isActive: false,
        commercialStatus: "READY_FOR_APPROVAL",
        codesApprovedAt: campaign.codesApprovedAt ?? new Date(),
        rulesConfiguredAt: campaign.rulesConfiguredAt ?? new Date(),
        paymentVerifiedAt: campaign.paymentVerifiedAt ?? new Date(),
        codeMode: campaign.codeMode ?? "GENERATE"
      }
    });
    return { activated: false, codesSeeded };
  }

  const now = new Date();
  const needsActivation =
    !campaign.isActive ||
    campaign.commercialStatus !== "LIVE" ||
    !campaign.codesApprovedAt ||
    !campaign.launchApprovedAt;

  if (needsActivation || codesSeeded > 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        isActive: true,
        commercialStatus: "LIVE",
        codesApprovedAt: campaign.codesApprovedAt ?? now,
        launchApprovedAt: campaign.launchApprovedAt ?? now,
        rulesConfiguredAt: campaign.rulesConfiguredAt ?? now,
        paymentVerifiedAt: campaign.paymentVerifiedAt ?? now,
        ...(brand.slug === MAGOME_BRAND_SLUG ? { codeMode: "GENERATE" } : {})
      }
    });

    if (brand.status !== "ACTIVE") {
      await prisma.brand.update({
        where: { id: brandId },
        data: { status: "ACTIVE", onboardingStatus: "COMMERCIALLY_ACTIVE" }
      });
    }
  }

  return { activated: needsActivation || codesSeeded > 0, codesSeeded };
}
