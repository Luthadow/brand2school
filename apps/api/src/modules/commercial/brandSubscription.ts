import type {
  BillingCycle,
  BrandSubscriptionPlan,
  BrandSubscriptionStatus,
  CampaignScopeType
} from "../../generated/prisma/index.js";
import {
  defaultActivationFeeZar,
  defaultMonthlySubscriptionZar,
  packageByScopeType,
  subscriptionPlanForScope,
  type TerritorialPackageId
} from "./territorialPackages.js";

export const SUBSCRIPTION_LIFECYCLE = [
  { stage: "ACTIVE", action: "Full campaign functionality" },
  { stage: "PAST_DUE", action: "Warning notifications — limited access during grace period" },
  { stage: "SUSPENDED", action: "Campaign participation paused — historical data retained" },
  {
    stage: "REVIEW_REQUIRED",
    action: "Founding-partner waiver ended — case-study review and conversion conversation"
  },
  { stage: "REACTIVATED", action: "Full access restored upon payment verification" }
] as const;

export const MINIMUM_COMMITMENT_MONTHS = 12;

/** Days of limited access after subscription end before suspension. */
export const SUBSCRIPTION_GRACE_DAYS = 14;

/** Days before subscription end to send renewal reminder. */
export const SUBSCRIPTION_RENEWAL_NOTICE_DAYS = 7;

export function subscriptionPlanFromPackageId(
  packageId: TerritorialPackageId | undefined
): BrandSubscriptionPlan | null {
  if (!packageId || packageId === "GOVERNMENT_INSTITUTIONAL") return null;
  const map: Record<Exclude<TerritorialPackageId, "GOVERNMENT_INSTITUTIONAL">, BrandSubscriptionPlan> = {
    SCHOOL_TRANSFORMATION: "SCHOOL",
    DISTRICT_TRANSFORMATION: "DISTRICT",
    PROVINCIAL_IMPACT: "PROVINCIAL",
    NATIONAL_TRANSFORMATION: "NATIONAL"
  };
  return map[packageId as Exclude<TerritorialPackageId, "GOVERNMENT_INSTITUTIONAL">];
}

export function initBrandSubscriptionFromScope(scopeType: CampaignScopeType): {
  subscriptionPlan: BrandSubscriptionPlan;
  recurringAmountZar: number;
  billingCycle: BillingCycle;
} {
  const pkg = packageByScopeType(scopeType);
  const { min } = defaultMonthlySubscriptionZar(scopeType);
  return {
    subscriptionPlan: subscriptionPlanForScope(scopeType),
    recurringAmountZar: min,
    billingCycle: "MONTHLY"
  };
}

export function subscriptionBlocksParticipation(status: BrandSubscriptionStatus | null | undefined): boolean {
  return status === "SUSPENDED" || status === "REVIEW_REQUIRED";
}

export function subscriptionAllowsLimitedAccess(status: BrandSubscriptionStatus | null | undefined): boolean {
  return status === "PAST_DUE";
}

export function serializeBrandSubscription(brand: {
  subscriptionStatus: BrandSubscriptionStatus | null;
  subscriptionPlan: BrandSubscriptionPlan | null;
  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;
  activationFeePaid: boolean;
  recurringAmountZar: { toNumber?: () => number } | number | null;
  billingCycle: BillingCycle;
  gracePeriodUntil: Date | null;
}) {
  const recurring =
    brand.recurringAmountZar != null
      ? typeof brand.recurringAmountZar === "number"
        ? brand.recurringAmountZar
        : Number(brand.recurringAmountZar)
      : null;

  return {
    status: brand.subscriptionStatus,
    plan: brand.subscriptionPlan,
    startDate: brand.subscriptionStartDate?.toISOString() ?? null,
    endDate: brand.subscriptionEndDate?.toISOString() ?? null,
    activationFeePaid: brand.activationFeePaid,
    recurringAmountZar: recurring,
    billingCycle: brand.billingCycle,
    gracePeriodUntil: brand.gracePeriodUntil?.toISOString() ?? null,
    minimumCommitmentMonths: MINIMUM_COMMITMENT_MONTHS,
    lifecycle: SUBSCRIPTION_LIFECYCLE,
    positioning:
      "Enterprise ESG infrastructure participation — not monthly donations."
  };
}

export { defaultActivationFeeZar, defaultMonthlySubscriptionZar };
