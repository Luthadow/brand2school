import { prisma } from "../../lib/prisma.js";
import { sendFoundingPartnershipExpiryNoticeEmail } from "../../lib/mail.js";
import { trySendBrandLifecycleEmail } from "./brandEmailNotify.js";
import { syncCampaignCommercialStatus } from "./campaignActivation.js";

/** Notice windows for founding-partner fee-waiver periods (days before end). */
export const FOUNDING_PARTNERSHIP_NOTICE_DAYS = [30, 14, 7] as const;

/** Lifetime founder passes use a far-future end date and are excluded. */
const LIFETIME_END_YEAR = 2090;

function daysUntil(end: Date, now: Date): number {
  return Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

function noticeBucket(daysRemaining: number): (typeof FOUNDING_PARTNERSHIP_NOTICE_DAYS)[number] | null {
  if (daysRemaining <= 0) return null;
  if (daysRemaining <= 7) return 7;
  if (daysRemaining <= 14) return 14;
  if (daysRemaining <= 30) return 30;
  return null;
}

async function noticeAlreadySent(brandId: string, days: number): Promise<boolean> {
  const existing = await prisma.auditLog.findFirst({
    where: {
      targetType: "Brand",
      targetId: brandId,
      action: `FOUNDING_PARTNERSHIP_NOTICE_${days}`
    },
    select: { id: true }
  });
  return Boolean(existing);
}

async function pauseBrandCampaignsForReview(brandId: string): Promise<number> {
  const campaigns = await prisma.campaign.findMany({
    where: {
      brandId,
      OR: [{ isActive: true }, { commercialStatus: { in: ["LIVE", "PAUSED", "READY_FOR_APPROVAL"] } }]
    },
    select: { id: true }
  });

  for (const campaign of campaigns) {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { isActive: false, commercialStatus: "PAUSED", renewalStatus: "PENDING_RENEWAL" }
    });
    await syncCampaignCommercialStatus(campaign.id);
  }

  return campaigns.length;
}

/**
 * Founding-partner (fee-waived) lifecycle:
 * - 30 / 14 / 7 day expiry notices
 * - On end date → REVIEW_REQUIRED (case-study / conversion conversation)
 */
export async function processFoundingPartnershipGovernance(now = new Date()): Promise<{
  noticesSent: number;
  markedReviewRequired: number;
}> {
  let noticesSent = 0;
  let markedReviewRequired = 0;

  const lifetimeCutoff = new Date(`${LIFETIME_END_YEAR}-01-01T00:00:00.000Z`);

  const partners = await prisma.brand.findMany({
    where: {
      founderExempt: true,
      subscriptionStatus: "ACTIVE",
      subscriptionEndDate: { not: null, lt: lifetimeCutoff }
    },
    select: {
      id: true,
      name: true,
      subscriptionEndDate: true,
      primaryContactEmail: true,
      contactPersons: true
    }
  });

  for (const brand of partners) {
    if (!brand.subscriptionEndDate) continue;
    const remaining = daysUntil(brand.subscriptionEndDate, now);

    if (remaining <= 0) {
      await prisma.brand.update({
        where: { id: brand.id },
        data: { subscriptionStatus: "REVIEW_REQUIRED" }
      });
      const paused = await pauseBrandCampaignsForReview(brand.id);

      await prisma.auditLog.create({
        data: {
          action: "FOUNDING_PARTNERSHIP_REVIEW_REQUIRED",
          targetType: "Brand",
          targetId: brand.id,
          payload: {
            brandName: brand.name,
            subscriptionEndDate: brand.subscriptionEndDate.toISOString(),
            campaignsPaused: paused
          }
        }
      });

      void trySendBrandLifecycleEmail(brand, (c) =>
        sendFoundingPartnershipExpiryNoticeEmail({
          to: c.email,
          contactName: c.name,
          brandName: brand.name,
          daysRemaining: 0,
          endDateIso: brand.subscriptionEndDate!.toISOString(),
          reviewRequired: true
        })
      );

      markedReviewRequired += 1;
      continue;
    }

    const bucket = noticeBucket(remaining);
    if (!bucket) continue;
    if (await noticeAlreadySent(brand.id, bucket)) continue;

    void trySendBrandLifecycleEmail(brand, (c) =>
      sendFoundingPartnershipExpiryNoticeEmail({
        to: c.email,
        contactName: c.name,
        brandName: brand.name,
        daysRemaining: bucket,
        endDateIso: brand.subscriptionEndDate!.toISOString(),
        reviewRequired: false
      })
    );

    await prisma.auditLog.create({
      data: {
        action: `FOUNDING_PARTNERSHIP_NOTICE_${bucket}`,
        targetType: "Brand",
        targetId: brand.id,
        payload: {
          brandName: brand.name,
          daysRemaining: remaining,
          noticeBucket: bucket,
          endDateIso: brand.subscriptionEndDate.toISOString()
        }
      }
    });

    noticesSent += 1;
  }

  return { noticesSent, markedReviewRequired };
}
