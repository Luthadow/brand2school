import { prisma } from "../../lib/prisma.js";
import {
  sendBrandSubscriptionPastDueEmail,
  sendBrandSubscriptionReactivatedEmail,
  sendBrandSubscriptionSuspendedEmail
} from "../../lib/mail.js";
import { trySendBrandLifecycleEmail } from "./brandEmailNotify.js";
import { syncCampaignCommercialStatus } from "./campaignActivation.js";
import { SUBSCRIPTION_GRACE_DAYS } from "./brandSubscription.js";
import { formatZar } from "./setupFees.js";

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function suspendBrandCampaigns(brandId: string): Promise<number> {
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
      data: { isActive: false, commercialStatus: "SUSPENDED" }
    });
    await syncCampaignCommercialStatus(campaign.id);
  }

  return campaigns.length;
}

/** Automated subscription lifecycle: past-due grace, then suspension. */
export async function processSubscriptionGovernance(now = new Date()): Promise<{
  markedPastDue: number;
  suspended: number;
}> {
  let markedPastDue = 0;
  let suspended = 0;

  const expiredActive = await prisma.brand.findMany({
    where: {
      subscriptionStatus: "ACTIVE",
      subscriptionEndDate: { lte: now }
    }
  });

  for (const brand of expiredActive) {
    const graceUntil = addDays(now, SUBSCRIPTION_GRACE_DAYS);
    await prisma.brand.update({
      where: { id: brand.id },
      data: {
        subscriptionStatus: "PAST_DUE",
        gracePeriodUntil: graceUntil
      }
    });

    void trySendBrandLifecycleEmail(brand, (c) =>
      sendBrandSubscriptionPastDueEmail({
        to: c.email,
        contactName: c.name,
        brandName: brand.name,
        gracePeriodUntilIso: graceUntil.toISOString()
      })
    );
    markedPastDue += 1;
  }

  const graceExpired = await prisma.brand.findMany({
    where: {
      subscriptionStatus: "PAST_DUE",
      gracePeriodUntil: { lte: now }
    }
  });

  for (const brand of graceExpired) {
    await prisma.brand.update({
      where: { id: brand.id },
      data: { subscriptionStatus: "SUSPENDED" }
    });
    const paused = await suspendBrandCampaigns(brand.id);

    void trySendBrandLifecycleEmail(brand, (c) =>
      sendBrandSubscriptionSuspendedEmail({
        to: c.email,
        contactName: c.name,
        brandName: brand.name,
        campaignsPaused: paused
      })
    );
    suspended += 1;
  }

  return { markedPastDue, suspended };
}

export async function notifySubscriptionReactivated(
  brandId: string,
  recurringAmountZar: number
): Promise<void> {
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) return;

  void trySendBrandLifecycleEmail(brand, (c) =>
    sendBrandSubscriptionReactivatedEmail({
      to: c.email,
      contactName: c.name,
      brandName: brand.name,
      recurringAmountZar: formatZar(recurringAmountZar)
    })
  );
}
