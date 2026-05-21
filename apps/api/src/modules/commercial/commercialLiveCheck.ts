import { prisma } from "../../lib/prisma.js";
import { brandAgreementApproved, brandSubscriptionActive } from "./campaignActivation.js";
import { subscriptionBlocksParticipation } from "./brandSubscription.js";
import { enforceCampaignExpiryGovernance, getCampaignExpiryBlockReason } from "./campaignExpiry.js";

/** Returns null when campaign may accept public submissions; otherwise a user-facing message. */
export async function getCampaignCommercialBlockReason(campaignId: string): Promise<string | null> {
  await enforceCampaignExpiryGovernance(campaignId);

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      brand: { include: { agreements: { where: { status: "APPROVED" }, take: 1 } } },
      invoices: true,
      _count: { select: { codes: true } }
    }
  });
  if (!campaign) return "Campaign not found.";

  const expiryBlock = getCampaignExpiryBlockReason(campaign);
  if (expiryBlock) return expiryBlock;

  if (!campaign.isActive) return "Campaign not active.";

  if (campaign.commercialStatus === "PAUSED") {
    return "Campaign is temporarily paused for fraud and participation review.";
  }
  if (campaign.commercialStatus === "SUSPENDED") {
    return "Campaign is suspended.";
  }

  if (!brandAgreementApproved(campaign.brand.agreements)) {
    return "Campaign is not yet commercially cleared (participation agreement pending).";
  }
  if (subscriptionBlocksParticipation(campaign.brand.subscriptionStatus)) {
    return "Brand subscription is suspended — campaign participation is paused.";
  }
  if (campaign.brand.subscriptionStatus === "PAST_DUE") {
    return "Subscription payment is overdue — campaign participation is limited during the grace period.";
  }
  if (!brandSubscriptionActive(campaign.brand, campaign.invoices)) {
    return "Active enterprise ESG infrastructure subscription required for campaign participation.";
  }
  if (!campaign.paymentVerifiedAt && !campaign.brand.activationFeePaid) {
    return "Activation fee has not been verified.";
  }
  if (!campaign.codesApprovedAt || campaign._count.codes === 0) {
    return "Campaign codes are not yet approved for public use.";
  }
  if (!campaign.launchApprovedAt) {
    return "Campaign launch has not been approved.";
  }
  return null;
}
