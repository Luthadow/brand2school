import type { BillingCycle, Campaign, Brand } from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";
import { sendBrandPaymentPendingEmail, sendBrandSubscriptionRenewalNoticeEmail } from "../../lib/mail.js";
import { trySendBrandLifecycleEmail } from "./brandEmailNotify.js";
import { nextInvoiceNumber } from "./campaignActivation.js";
import { SUBSCRIPTION_RENEWAL_NOTICE_DAYS } from "./brandSubscription.js";
import { defaultMonthlySubscriptionZar, formatZar } from "./territorialPackages.js";

const OPEN_SUBSCRIPTION_STATUSES = ["DRAFT", "ISSUED", "PAYMENT_REPORTED"] as const;

export function recurringSubscriptionAmountZar(
  brand: Pick<Brand, "recurringAmountZar">,
  scopeType: Campaign["scopeType"]
): number {
  const stored = brand.recurringAmountZar != null ? Number(brand.recurringAmountZar) : 0;
  if (stored > 0) return stored;
  return defaultMonthlySubscriptionZar(scopeType).min;
}

export async function brandHasOpenSubscriptionInvoice(brandId: string): Promise<boolean> {
  const open = await prisma.campaignInvoice.findFirst({
    where: {
      invoiceType: "SAAS_SUBSCRIPTION",
      status: { in: [...OPEN_SUBSCRIPTION_STATUSES] },
      campaign: { brandId }
    },
    select: { id: true }
  });
  return Boolean(open);
}

/** Prefer live campaigns, then any campaign for the brand. */
export async function pickCampaignForSubscriptionInvoice(brandId: string) {
  const live = await prisma.campaign.findFirst({
    where: { brandId, OR: [{ isActive: true }, { commercialStatus: "LIVE" }] },
    orderBy: { updatedAt: "desc" },
    include: { brand: true }
  });
  if (live) return live;

  return prisma.campaign.findFirst({
    where: { brandId },
    orderBy: { updatedAt: "desc" },
    include: { brand: true }
  });
}

export type IssuedSubscriptionInvoice = {
  invoiceId: string;
  invoiceNumber: string;
  campaignId: string;
  brandId: string;
  amountZar: number;
  eftReference: string;
};

export async function issueSaasSubscriptionInvoice(input: {
  campaignId: string;
  /** When true, notes mark the invoice as auto-issued for the next billing cycle. */
  autoRenewal?: boolean;
  sendPaymentEmail?: boolean;
}): Promise<IssuedSubscriptionInvoice | { error: string; status: number }> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: input.campaignId },
    include: { brand: true }
  });
  if (!campaign) {
    return { error: "Campaign not found.", status: 404 };
  }

  const amount = recurringSubscriptionAmountZar(campaign.brand, campaign.scopeType);
  if (amount <= 0) {
    return { error: "No recurring subscription amount configured for this brand.", status: 400 };
  }

  if (input.autoRenewal) {
    const alreadyOpen = await brandHasOpenSubscriptionInvoice(campaign.brandId);
    if (alreadyOpen) {
      return { error: "Open subscription invoice already exists for this brand.", status: 409 };
    }
  }

  const invoiceNumber = await nextInvoiceNumber();
  const eftReference = `B2S-${campaign.slug.slice(0, 10).toUpperCase()}-SUB`;
  const cycleLabel = campaign.brand.billingCycle;
  const notes = input.autoRenewal
    ? `Auto-issued next-cycle enterprise ESG subscription (${cycleLabel}): ${formatZar(amount)}`
    : `Enterprise ESG infrastructure subscription (${cycleLabel}): ${formatZar(amount)}`;

  const invoice = await prisma.campaignInvoice.create({
    data: {
      campaignId: campaign.id,
      invoiceNumber,
      invoiceType: "SAAS_SUBSCRIPTION",
      amountZar: amount,
      status: "ISSUED",
      eftReference,
      issuedAt: new Date(),
      notes
    }
  });

  if (input.sendPaymentEmail !== false) {
    void trySendBrandLifecycleEmail(campaign.brand, (c) =>
      sendBrandPaymentPendingEmail({
        to: c.email,
        contactName: c.name,
        brandName: campaign.brand.name,
        campaignName: campaign.name,
        invoiceNumber,
        amountZar: formatZar(amount),
        eftReference
      })
    );
  }

  return {
    invoiceId: invoice.id,
    invoiceNumber,
    campaignId: campaign.id,
    brandId: campaign.brandId,
    amountZar: amount,
    eftReference
  };
}

function daysUntil(end: Date, now: Date): number {
  return Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

function billingCycleLabel(cycle: BillingCycle): string {
  return cycle === "QUARTERLY" ? "quarterly" : cycle === "ANNUAL" ? "annual" : "monthly";
}

/**
 * Auto-issue next-cycle SAAS_SUBSCRIPTION invoices for brands whose period
 * is ending soon, or who are already past-due / suspended without an open invoice.
 */
export async function issueDueSubscriptionRenewalInvoices(now = new Date()): Promise<{
  invoicesIssued: number;
  renewalNoticesSent: number;
}> {
  let invoicesIssued = 0;
  let renewalNoticesSent = 0;

  const noticeThreshold = new Date(now);
  noticeThreshold.setDate(noticeThreshold.getDate() + SUBSCRIPTION_RENEWAL_NOTICE_DAYS);

  const candidates = await prisma.brand.findMany({
    where: {
      founderExempt: false,
      OR: [
        {
          subscriptionStatus: "ACTIVE",
          subscriptionEndDate: { lte: noticeThreshold }
        },
        { subscriptionStatus: { in: ["PAST_DUE", "SUSPENDED"] } }
      ]
    },
    select: {
      id: true,
      name: true,
      subscriptionStatus: true,
      subscriptionEndDate: true,
      recurringAmountZar: true,
      billingCycle: true,
      primaryContactEmail: true,
      contactPersons: true
    }
  });

  for (const brand of candidates) {
    const hasOpen = await brandHasOpenSubscriptionInvoice(brand.id);
    if (hasOpen) continue;

    const campaign = await pickCampaignForSubscriptionInvoice(brand.id);
    if (!campaign) continue;

    const amount = recurringSubscriptionAmountZar(campaign.brand, campaign.scopeType);
    if (amount <= 0) continue;

    const issued = await issueSaasSubscriptionInvoice({
      campaignId: campaign.id,
      autoRenewal: true,
      sendPaymentEmail: true
    });
    if ("error" in issued) continue;

    invoicesIssued += 1;

    if (brand.subscriptionStatus === "ACTIVE" && brand.subscriptionEndDate) {
      const remaining = daysUntil(brand.subscriptionEndDate, now);
      if (remaining > 0) {
        void trySendBrandLifecycleEmail(brand, (c) =>
          sendBrandSubscriptionRenewalNoticeEmail({
            to: c.email,
            contactName: c.name,
            brandName: brand.name,
            daysRemaining: remaining,
            endDateIso: brand.subscriptionEndDate!.toISOString(),
            recurringAmountZar: `${formatZar(issued.amountZar)} (${billingCycleLabel(brand.billingCycle)})`
          })
        );
        renewalNoticesSent += 1;
      }
    }
  }

  return { invoicesIssued, renewalNoticesSent };
}
