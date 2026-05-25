import { prisma } from "../../lib/prisma.js";
import { getCampaignCommercialBlockReason } from "../commercial/commercialLiveCheck.js";
import { getCampaignExpiryBlockReason } from "../commercial/campaignExpiry.js";

export type ResolveParticipationCampaignInput = {
  brandSlug?: string;
  campaignSlug?: string;
};

export type ResolveParticipationCampaignResult =
  | { ok: true; campaignSlug: string; brandSlug: string; brandName: string; campaignName: string }
  | { ok: false; message: string };

type CampaignLiveFields = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  autoSuspendOnExpiry: boolean;
  gracePeriodEndsAt: Date | null;
  gracePeriodDays: number;
  expiredAt: Date | null;
};

async function isCampaignLive(campaign: CampaignLiveFields, now: Date): Promise<boolean> {
  if (!campaign.isActive) return false;
  if (getCampaignExpiryBlockReason(campaign, now)) return false;
  if (await getCampaignCommercialBlockReason(campaign.id)) return false;
  return true;
}

/** Resolve brand + campaign selection into a single campaign slug for submission. */
export async function resolveParticipationCampaign(
  input: ResolveParticipationCampaignInput,
  now = new Date()
): Promise<ResolveParticipationCampaignResult> {
  if (input.campaignSlug?.trim()) {
    const campaign = await prisma.campaign.findUnique({
      where: { slug: input.campaignSlug.trim().toLowerCase() },
      include: { brand: { select: { slug: true, name: true, status: true } } }
    });
    if (!campaign || !campaign.isActive) {
      return { ok: false, message: "Campaign not active." };
    }
    if (campaign.brand.status !== "ACTIVE") {
      return { ok: false, message: "Brand partner is not active." };
    }
    const live = await isCampaignLive(campaign, now);
    if (!live) {
      return { ok: false, message: "Campaign is not accepting submissions right now." };
    }
    return {
      ok: true,
      campaignSlug: campaign.slug,
      brandSlug: campaign.brand.slug,
      brandName: campaign.brand.name,
      campaignName: campaign.name
    };
  }

  const brandSlug = input.brandSlug?.trim().toLowerCase();
  if (!brandSlug) {
    return { ok: false, message: "Select a brand from the list." };
  }

  const brand = await prisma.brand.findFirst({
    where: { slug: brandSlug, status: "ACTIVE" },
    include: {
      campaigns: {
        where: { isActive: true },
        select: {
          id: true,
          slug: true,
          name: true,
          startsAt: true,
          endsAt: true,
          isActive: true,
          autoSuspendOnExpiry: true,
          gracePeriodEndsAt: true,
          gracePeriodDays: true,
          expiredAt: true
        },
        orderBy: { name: "asc" }
      }
    }
  });

  if (!brand) {
    return { ok: false, message: "Brand not found or not active." };
  }

  const liveCampaigns: Array<{ slug: string; name: string }> = [];
  for (const c of brand.campaigns) {
    if (await isCampaignLive(c, now)) {
      liveCampaigns.push({ slug: c.slug, name: c.name });
    }
  }

  if (liveCampaigns.length === 0) {
    return { ok: false, message: "This brand has no active campaigns accepting codes right now." };
  }

  if (liveCampaigns.length === 1) {
    return {
      ok: true,
      campaignSlug: liveCampaigns[0].slug,
      brandSlug: brand.slug,
      brandName: brand.name,
      campaignName: liveCampaigns[0].name
    };
  }

  return {
    ok: false,
    message: `"${brand.name}" has multiple active campaigns — select the campaign for your product pack.`
  };
}
