import { prisma } from "../../lib/prisma.js";
import { sendBrandRenewalNoticeEmail } from "../../lib/mail.js";
import { getCampaignExpiryState } from "./campaignExpiry.js";
import { syncCampaignCommercialStatus } from "./campaignActivation.js";
import { trySendBrandLifecycleEmail } from "./brandEmailNotify.js";

const RENEWAL_NOTICE_DAYS = 60;

/** Mark campaigns approaching licence end for renewal workflows. */
export async function processAnnualLicenseRenewalGovernance(now = new Date()): Promise<{
  pendingRenewal: number;
  lapsed: number;
}> {
  const noticeThreshold = new Date(now.getTime() + RENEWAL_NOTICE_DAYS * 24 * 60 * 60 * 1000);

  const activeCampaigns = await prisma.campaign.findMany({
    where: {
      commercialStatus: { in: ["LIVE", "PAUSED", "READY_FOR_APPROVAL"] },
      renewalStatus: { notIn: ["RENEWED"] }
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      gracePeriodEndsAt: true,
      gracePeriodDays: true,
      expiredAt: true,
      autoSuspendOnExpiry: true,
      renewalStatus: true,
      isActive: true
    }
  });

  let pendingRenewal = 0;
  let lapsed = 0;

  for (const campaign of activeCampaigns) {
    const expiry = getCampaignExpiryState(campaign, now);

    if (expiry.isExpired) {
      if (campaign.renewalStatus !== "LAPSED") {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            renewalStatus: "LAPSED",
            isActive: false,
            commercialStatus: "EXPIRED",
            expiredAt: campaign.expiredAt ?? now
          }
        });
        lapsed += 1;
      }
      continue;
    }

    if (campaign.endsAt <= noticeThreshold && campaign.renewalStatus === "NONE") {
      const full = await prisma.campaign.findUnique({
        where: { id: campaign.id },
        include: { brand: true }
      });
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { renewalStatus: "PENDING_RENEWAL" }
      });
      await syncCampaignCommercialStatus(campaign.id);
      pendingRenewal += 1;

      if (full?.brand && full.endsAt) {
        const daysRemaining = Math.max(
          0,
          Math.ceil((full.endsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        );
        void trySendBrandLifecycleEmail(full.brand, (c) =>
          sendBrandRenewalNoticeEmail({
            to: c.email,
            contactName: c.name,
            brandName: full.brand.name,
            campaignName: full.name,
            endsAtIso: full.endsAt.toISOString(),
            daysRemaining
          })
        );
      }
    }
  }

  return { pendingRenewal, lapsed };
}
