import type { Campaign } from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";

export type CampaignExpiryState = {
  startsAt: Date;
  endsAt: Date;
  gracePeriodEndsAt: Date;
  isBeforeStart: boolean;
  isAfterEnd: boolean;
  isInGracePeriod: boolean;
  isExpired: boolean;
  daysUntilEnd: number | null;
};

type CampaignExpiryFields = Pick<
  Campaign,
  "startsAt" | "endsAt" | "gracePeriodEndsAt" | "gracePeriodDays" | "expiredAt" | "autoSuspendOnExpiry"
>;

export function computeGracePeriodEndsAt(campaign: Pick<Campaign, "endsAt" | "gracePeriodDays">): Date {
  const days = campaign.gracePeriodDays ?? 14;
  return new Date(campaign.endsAt.getTime() + days * 24 * 60 * 60 * 1000);
}

export function getCampaignExpiryState(campaign: CampaignExpiryFields, now = new Date()): CampaignExpiryState {
  const gracePeriodEndsAt = campaign.gracePeriodEndsAt ?? computeGracePeriodEndsAt(campaign as Campaign);
  const isBeforeStart = now < campaign.startsAt;
  const isAfterEnd = now > campaign.endsAt;
  const isInGracePeriod = isAfterEnd && now <= gracePeriodEndsAt;
  const isExpired = Boolean(campaign.expiredAt) || now > gracePeriodEndsAt;
  const daysUntilEnd = isBeforeStart || isExpired
    ? null
    : Math.ceil((campaign.endsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  return {
    startsAt: campaign.startsAt,
    endsAt: campaign.endsAt,
    gracePeriodEndsAt,
    isBeforeStart,
    isAfterEnd,
    isInGracePeriod,
    isExpired,
    daysUntilEnd
  };
}

export function getCampaignExpiryBlockReason(campaign: CampaignExpiryFields, now = new Date()): string | null {
  const state = getCampaignExpiryState(campaign, now);
  if (state.isBeforeStart) return "Campaign has not started yet.";
  if (state.isExpired) return "Campaign has expired and no longer accepts participation.";
  return null;
}

/** Auto-suspend expired campaigns and sync commercial status. */
export async function enforceCampaignExpiryGovernance(campaignId: string, now = new Date()): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { brand: { include: { agreements: true } } }
  });
  if (!campaign) return;

  const expiry = getCampaignExpiryState(campaign, now);
  if (!expiry.isExpired || !campaign.autoSuspendOnExpiry) return;
  if (campaign.expiredAt && !campaign.isActive) return;

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      isActive: false,
      expiredAt: campaign.expiredAt ?? now,
      commercialStatus: "EXPIRED",
      renewalStatus: campaign.renewalStatus === "RENEWED" ? "RENEWED" : "LAPSED"
    }
  });

  await prisma.brand.update({
    where: { id: campaign.brandId },
    data: { featuredOnHome: false }
  }).catch(() => undefined);
}
