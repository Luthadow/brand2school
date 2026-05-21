import type { Brand, BrandAgreement, Campaign } from "../../generated/prisma/index.js";
import type { ActivationGateResult } from "./campaignActivation.js";
import { brandAgreementApproved } from "./campaignActivation.js";

function isCampaignExpired(
  campaign: Pick<Campaign, "endsAt" | "gracePeriodEndsAt" | "gracePeriodDays" | "expiredAt">,
  now = new Date()
): boolean {
  const graceDays = campaign.gracePeriodDays ?? 14;
  const graceEnd =
    campaign.gracePeriodEndsAt ?? new Date(campaign.endsAt.getTime() + graceDays * 24 * 60 * 60 * 1000);
  return Boolean(campaign.expiredAt) || now > graceEnd;
}

/** Canonical enterprise workflow stages for sales, ops, and compliance visibility. */
export type CommercialWorkflowStage =
  | "PENDING"
  | "UNDER_REVIEW"
  | "AWAITING_AGREEMENT"
  | "AWAITING_PAYMENT"
  | "AWAITING_CODES"
  | "READY_FOR_APPROVAL"
  | "ACTIVE"
  | "SUSPENDED"
  | "EXPIRED";

export const ENTERPRISE_ACTIVATION_CHAIN = [
  { step: 1, key: "registration", label: "Brand registration" },
  { step: 2, key: "popia", label: "POPIA acceptance" },
  { step: 3, key: "agreement", label: "Agreement signed & approved" },
  { step: 4, key: "brandReview", label: "Brand verification review" },
  { step: 5, key: "payment", label: "Payment verified" },
  { step: 6, key: "rules", label: "Campaign rules approved" },
  { step: 7, key: "codes", label: "Codes uploaded / generated" },
  { step: 8, key: "activated", label: "Campaign activated" }
] as const;

export const WORKFLOW_STAGE_LABELS: Record<CommercialWorkflowStage, string> = {
  PENDING: "Pending review",
  UNDER_REVIEW: "Under review",
  AWAITING_AGREEMENT: "Awaiting agreement",
  AWAITING_PAYMENT: "Awaiting payment",
  AWAITING_CODES: "Awaiting codes",
  READY_FOR_APPROVAL: "Ready for approval",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  EXPIRED: "Expired"
};

export function resolveBrandWorkflowStage(
  brand: Pick<Brand, "onboardingStatus" | "status">
): CommercialWorkflowStage {
  if (brand.onboardingStatus === "SUSPENDED") return "SUSPENDED";
  if (brand.onboardingStatus === "PENDING_REVIEW") return "PENDING";
  if (brand.onboardingStatus === "UNDER_APPROVAL") return "UNDER_REVIEW";
  if (brand.onboardingStatus === "AGREEMENT_PENDING") return "AWAITING_AGREEMENT";
  return "UNDER_REVIEW";
}

export function resolveCampaignWorkflowStage(
  campaign: Pick<
    Campaign,
    | "isActive"
    | "commercialStatus"
    | "startsAt"
    | "endsAt"
    | "gracePeriodDays"
    | "gracePeriodEndsAt"
    | "expiredAt"
    | "autoSuspendOnExpiry"
  >,
  brand: Pick<Brand, "onboardingStatus">,
  gate: ActivationGateResult,
  agreements: BrandAgreement[],
  now = new Date()
): CommercialWorkflowStage {
  if (isCampaignExpired(campaign, now)) return "EXPIRED";
  if (brand.onboardingStatus === "SUSPENDED" || campaign.commercialStatus === "SUSPENDED") {
    return "SUSPENDED";
  }
  if (campaign.commercialStatus === "PAUSED") return "SUSPENDED";
  if (campaign.isActive && gate.canActivate) return "ACTIVE";
  if (!brandAgreementApproved(agreements)) return "AWAITING_AGREEMENT";
  if (brand.onboardingStatus === "PENDING_REVIEW") return "PENDING";
  if (brand.onboardingStatus === "UNDER_APPROVAL" || brand.onboardingStatus === "AGREEMENT_PENDING") {
    if (!brandAgreementApproved(agreements)) return "AWAITING_AGREEMENT";
    return "UNDER_REVIEW";
  }
  if (!gate.checklist.setupPaymentVerified) return "AWAITING_PAYMENT";
  if (!gate.checklist.codesApproved) return "AWAITING_CODES";
  if (!gate.checklist.rulesConfigured) return "AWAITING_CODES";
  if (gate.canActivate && !gate.checklist.launchApproved) return "READY_FOR_APPROVAL";
  return "READY_FOR_APPROVAL";
}

export function mapWorkflowToCommercialStatus(stage: CommercialWorkflowStage): Campaign["commercialStatus"] {
  switch (stage) {
    case "ACTIVE":
      return "LIVE";
    case "EXPIRED":
      return "EXPIRED";
    case "SUSPENDED":
      return "SUSPENDED";
    case "READY_FOR_APPROVAL":
      return "READY_FOR_APPROVAL";
    case "AWAITING_PAYMENT":
      return "AWAITING_PAYMENT";
    case "AWAITING_CODES":
      return "AWAITING_CODES";
    case "AWAITING_AGREEMENT":
      return "AWAITING_AGREEMENT";
    default:
      return "DRAFT";
  }
}
