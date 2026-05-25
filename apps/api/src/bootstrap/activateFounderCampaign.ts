import type { PrismaClient } from "../generated/prisma/index.js";
import { generateSecureCodeBatch } from "../modules/codes/generateBatch.js";
import { FOUNDER_BRAND_SLUG } from "./bootstrapFounderBrand.js";

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
    const batch = await generateSecureCodeBatch({
      campaignId,
      batchName: "Founder launch codes",
      count: FOUNDER_STARTER_CODE_COUNT
    });
    codesSeeded = batch.generatedCount;
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
        paymentVerifiedAt: campaign.paymentVerifiedAt ?? now
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
