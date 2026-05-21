import type { Brand, BrandAgreement, Campaign, CampaignInvoice, Prisma } from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";
import { enforceCampaignExpiryGovernance, getCampaignExpiryState } from "./campaignExpiry.js";
import {
  mapWorkflowToCommercialStatus,
  resolveCampaignWorkflowStage,
  WORKFLOW_STAGE_LABELS,
  type CommercialWorkflowStage
} from "./commercialWorkflow.js";
import { computeDeliveredImpact, serializeImpactComparison } from "./impactMetrics.js";
import { subscriptionBlocksParticipation } from "./brandSubscription.js";
import { setupFeeZarForScope } from "./setupFees.js";

export type ActivationGateResult = {
  canActivate: boolean;
  blockers: string[];
  checklist: {
    brandOnboarding: boolean;
    agreementSigned: boolean;
    activationFeeVerified: boolean;
    subscriptionActive: boolean;
    setupPaymentVerified: boolean;
    codesApproved: boolean;
    rulesConfigured: boolean;
    launchApproved: boolean;
  };
};

type CampaignWithCommercial = Campaign & {
  brand: Brand & { agreements: BrandAgreement[] };
  invoices: CampaignInvoice[];
  _count?: { codes: number };
};

export function campaignRulesConfigured(
  campaign: Pick<Campaign, "scopeType" | "allowedProvinces" | "allowedDistricts" | "allowedSchoolIds">
): boolean {
  if (campaign.scopeType === "NATIONAL") return true;
  if (campaign.scopeType === "PROVINCIAL") {
    return campaign.allowedProvinces.length > 0;
  }
  if (campaign.scopeType === "DISTRICT") {
    return campaign.allowedDistricts.length > 0;
  }
  if (campaign.scopeType === "SCHOOL_CLUSTER") {
    return campaign.allowedSchoolIds.length > 0;
  }
  return false;
}

export function brandAgreementApproved(agreements: BrandAgreement[]): boolean {
  return agreements.some((a) => a.status === "APPROVED");
}

export function setupInvoiceVerified(invoices: CampaignInvoice[]): boolean {
  return invoices.some((i) => i.invoiceType === "SETUP_FEE" && i.status === "VERIFIED");
}

export function subscriptionInvoiceVerified(invoices: CampaignInvoice[]): boolean {
  return invoices.some((i) => i.invoiceType === "SAAS_SUBSCRIPTION" && i.status === "VERIFIED");
}

export function brandSubscriptionActive(
  brand: Pick<Brand, "subscriptionStatus" | "activationFeePaid">,
  invoices: CampaignInvoice[]
): boolean {
  if (subscriptionBlocksParticipation(brand.subscriptionStatus)) return false;
  if (brand.subscriptionStatus === "PAST_DUE") return false;
  if (brand.subscriptionStatus === "ACTIVE") return true;
  if (subscriptionInvoiceVerified(invoices)) return true;
  return brand.subscriptionStatus == null;
}

export function brandActivationFeeVerified(
  brand: Pick<Brand, "activationFeePaid">,
  invoices: CampaignInvoice[],
  paymentVerifiedAt: Date | null
): boolean {
  return Boolean(brand.activationFeePaid) || Boolean(paymentVerifiedAt) || setupInvoiceVerified(invoices);
}

export function evaluateActivationGate(campaign: CampaignWithCommercial, codeCount: number): ActivationGateResult {
  const blockers: string[] = [];

  const brandOnboardingOk =
    campaign.brand.onboardingStatus === "COMMERCIALLY_ACTIVE" ||
    campaign.brand.onboardingStatus === "UNDER_APPROVAL" ||
    campaign.brand.status === "ACTIVE";

  if (campaign.brand.onboardingStatus === "PENDING_REVIEW") {
    blockers.push("Brand application is still pending internal review.");
  }
  if (campaign.brand.onboardingStatus === "SUSPENDED") {
    blockers.push("Brand onboarding is suspended.");
  }

  const agreementSigned = brandAgreementApproved(campaign.brand.agreements);
  if (!agreementSigned) {
    blockers.push("Brand2School Participation Agreement must be generated, signed, and approved.");
  }

  const activationFeeVerified = brandActivationFeeVerified(
    campaign.brand,
    campaign.invoices,
    campaign.paymentVerifiedAt
  );
  if (!activationFeeVerified) {
    blockers.push("Activation fee must be verified before campaign activation.");
  }

  const subscriptionActive = brandSubscriptionActive(campaign.brand, campaign.invoices);
  if (!subscriptionActive) {
    if (campaign.brand.subscriptionStatus === "PAST_DUE") {
      blockers.push("Subscription payment is overdue — grace period may apply.");
    } else {
      blockers.push("Active monthly ESG infrastructure subscription required before public launch.");
    }
  }

  const setupPaymentVerified = activationFeeVerified;

  const codesApproved = Boolean(campaign.codesApprovedAt) && codeCount > 0;
  if (!campaign.codesApprovedAt) {
    blockers.push("Product codes must be uploaded/generated and approved by admin.");
  } else if (codeCount === 0) {
    blockers.push("At least one product code must exist for this campaign.");
  }

  const rulesConfigured = Boolean(campaign.rulesConfiguredAt) && campaignRulesConfigured(campaign);
  if (!rulesConfigured) {
    blockers.push("Campaign eligibility rules (scope, provinces/districts/schools, budget) must be configured.");
  }

  const launchApproved = Boolean(campaign.launchApprovedAt);
  if (!launchApproved) {
    blockers.push("Admin launch approval is required.");
  }

  const checklist = {
    brandOnboarding: brandOnboardingOk,
    agreementSigned,
    activationFeeVerified,
    subscriptionActive,
    setupPaymentVerified,
    codesApproved,
    rulesConfigured,
    launchApproved
  };

  const canActivate =
    brandOnboardingOk &&
    agreementSigned &&
    activationFeeVerified &&
    subscriptionActive &&
    codesApproved &&
    rulesConfigured &&
    launchApproved;

  return { canActivate, blockers, checklist };
}

export async function loadCampaignForActivation(campaignId: string): Promise<CampaignWithCommercial | null> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      brand: { include: { agreements: { orderBy: { version: "desc" } } } },
      invoices: true,
      _count: { select: { codes: true } }
    }
  });
  return campaign;
}

export async function assertCampaignCanGoLive(campaignId: string): Promise<ActivationGateResult> {
  const campaign = await loadCampaignForActivation(campaignId);
  if (!campaign) {
    return {
      canActivate: false,
      blockers: ["Campaign not found."],
      checklist: {
        brandOnboarding: false,
        agreementSigned: false,
        activationFeeVerified: false,
        subscriptionActive: false,
        setupPaymentVerified: false,
        codesApproved: false,
        rulesConfigured: false,
        launchApproved: false
      }
    };
  }
  return evaluateActivationGate(campaign, campaign._count?.codes ?? 0);
}

export async function syncCampaignCommercialStatus(campaignId: string): Promise<void> {
  await enforceCampaignExpiryGovernance(campaignId);

  const campaign = await loadCampaignForActivation(campaignId);
  if (!campaign) return;

  const gate = evaluateActivationGate(campaign, campaign._count?.codes ?? 0);
  const workflowStage = resolveCampaignWorkflowStage(
    campaign,
    campaign.brand,
    gate,
    campaign.brand.agreements
  );
  let commercialStatus = mapWorkflowToCommercialStatus(workflowStage);

  if (campaign.isActive && gate.canActivate && workflowStage !== "EXPIRED") {
    commercialStatus = "LIVE";
  } else if (campaign.isActive && !gate.canActivate) {
    commercialStatus = "PAUSED";
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { commercialStatus }
  });
}

export async function markRulesConfiguredIfReady(
  campaignId: string,
  data: Pick<Campaign, "scopeType" | "allowedProvinces" | "allowedDistricts" | "allowedSchoolIds" | "budgetAllocatedZar">
): Promise<void> {
  if (!campaignRulesConfigured(data)) return;
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { rulesConfiguredAt: new Date() }
  });
  await syncCampaignCommercialStatus(campaignId);
}

export function defaultSetupFeeForCampaign(campaign: Pick<Campaign, "scopeType" | "setupFeeZar">): number {
  const stored = Number(campaign.setupFeeZar);
  if (stored > 0) return stored;
  return setupFeeZarForScope(campaign.scopeType);
}

export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `B2S-${year}-`;
  const latest = await prisma.campaignInvoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true }
  });
  const seq = latest ? Number(latest.invoiceNumber.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(seq).padStart(5, "0")}`;
}

export type CommercialCampaignSummary = {
  id: string;
  name: string;
  slug: string;
  commercialStatus: string;
  isActive: boolean;
  setupFeeZar: number;
  contributionPoolZar: number | null;
  paymentVerifiedAt: string | null;
  codesApprovedAt: string | null;
  rulesConfiguredAt: string | null;
  launchApprovedAt: string | null;
  codeCount: number;
  activation: ActivationGateResult;
  workflowStage: CommercialWorkflowStage;
  workflowLabel: string;
  startsAt: string;
  endsAt: string;
  gracePeriodEndsAt: string;
  renewalStatus: string;
  expiry: {
    isExpired: boolean;
    isInGracePeriod: boolean;
    daysUntilEnd: number | null;
  };
  impact: {
    committed: {
      schoolsTargeted: number;
      schoolsReached: number;
      waterPhasesCompleted: number;
      activeInfrastructureProjects: number;
    };
    delivered: {
      schoolsTargeted: number;
      schoolsReached: number;
      waterPhasesCompleted: number;
      activeInfrastructureProjects: number;
    };
  };
};

export async function serializeCommercialCampaign(
  campaign: CampaignWithCommercial,
  codeCount: number,
  activation: ActivationGateResult
): Promise<CommercialCampaignSummary> {
  const workflowStage = resolveCampaignWorkflowStage(
    campaign,
    campaign.brand,
    activation,
    campaign.brand.agreements
  );
  const expiry = getCampaignExpiryState(campaign);
  const delivered = await computeDeliveredImpact(campaign.id);
  const impact = serializeImpactComparison(campaign.impactCommitment, delivered);

  return {
    id: campaign.id,
    name: campaign.name,
    slug: campaign.slug,
    commercialStatus: campaign.commercialStatus,
    isActive: campaign.isActive,
    setupFeeZar: defaultSetupFeeForCampaign(campaign),
    contributionPoolZar: campaign.contributionPoolZar != null ? Number(campaign.contributionPoolZar) : null,
    paymentVerifiedAt: campaign.paymentVerifiedAt?.toISOString() ?? null,
    codesApprovedAt: campaign.codesApprovedAt?.toISOString() ?? null,
    rulesConfiguredAt: campaign.rulesConfiguredAt?.toISOString() ?? null,
    launchApprovedAt: campaign.launchApprovedAt?.toISOString() ?? null,
    codeCount,
    activation,
    workflowStage,
    workflowLabel: WORKFLOW_STAGE_LABELS[workflowStage],
    startsAt: campaign.startsAt.toISOString(),
    endsAt: campaign.endsAt.toISOString(),
    gracePeriodEndsAt: expiry.gracePeriodEndsAt.toISOString(),
    renewalStatus: campaign.renewalStatus,
    expiry: {
      isExpired: expiry.isExpired,
      isInGracePeriod: expiry.isInGracePeriod,
      daysUntilEnd: expiry.daysUntilEnd
    },
    impact: {
      committed: {
        schoolsTargeted: impact.committed.schoolsTargeted,
        schoolsReached: impact.committed.schoolsReached,
        waterPhasesCompleted: impact.committed.waterPhasesCompleted,
        activeInfrastructureProjects: impact.committed.activeInfrastructureProjects
      },
      delivered: {
        schoolsTargeted: impact.delivered.schoolsTargeted,
        schoolsReached: impact.delivered.schoolsReached,
        waterPhasesCompleted: impact.delivered.waterPhasesCompleted,
        activeInfrastructureProjects: impact.delivered.activeInfrastructureProjects
      }
    }
  };
}
