import { prisma } from "../../lib/prisma.js";
import { evaluateActivationGate } from "./campaignActivation.js";
import { getCampaignExpiryState } from "./campaignExpiry.js";
import { computeDeliveredImpact, serializeImpactComparison } from "./impactMetrics.js";
import {
  ENTERPRISE_ACTIVATION_CHAIN,
  resolveBrandWorkflowStage,
  resolveCampaignWorkflowStage,
  WORKFLOW_STAGE_LABELS,
  type CommercialWorkflowStage
} from "./commercialWorkflow.js";

export async function getCommercialWorkflowBoard() {
  const brands = await prisma.brand.findMany({
    include: {
      agreements: { orderBy: { version: "desc" }, take: 1 },
      campaigns: {
        include: {
          invoices: { where: { invoiceType: "SETUP_FEE" }, orderBy: { createdAt: "desc" }, take: 1 },
          _count: { select: { codes: true, submissions: true } }
        },
        orderBy: { createdAt: "desc" }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  const pipeline: Record<CommercialWorkflowStage, number> = {
    PENDING: 0,
    UNDER_REVIEW: 0,
    AWAITING_AGREEMENT: 0,
    AWAITING_PAYMENT: 0,
    AWAITING_CODES: 0,
    READY_FOR_APPROVAL: 0,
    ACTIVE: 0,
    SUSPENDED: 0,
    EXPIRED: 0
  };

  const items = await Promise.all(
    brands.map(async (brand) => {
      const brandStage = resolveBrandWorkflowStage(brand);

      const campaigns = await Promise.all(
        brand.campaigns.map(async (campaign) => {
          const gate = evaluateActivationGate(
            {
              ...campaign,
              brand: { ...brand, agreements: brand.agreements }
            },
            campaign._count.codes
          );
          const workflowStage = resolveCampaignWorkflowStage(
            campaign,
            brand,
            gate,
            brand.agreements
          );
          const expiry = getCampaignExpiryState(campaign);
          const delivered = await computeDeliveredImpact(campaign.id);
          const impact = serializeImpactComparison(campaign.impactCommitment, delivered);

          return {
            id: campaign.id,
            name: campaign.name,
            slug: campaign.slug,
            workflowStage,
            workflowLabel: WORKFLOW_STAGE_LABELS[workflowStage],
            commercialStatus: campaign.commercialStatus,
            isActive: campaign.isActive,
            startsAt: campaign.startsAt.toISOString(),
            endsAt: campaign.endsAt.toISOString(),
            gracePeriodEndsAt: expiry.gracePeriodEndsAt.toISOString(),
            renewalStatus: campaign.renewalStatus,
            expiry,
            setupFeeZar: Number(campaign.setupFeeZar),
            invoiceStatus: campaign.invoices[0]?.status ?? null,
            codeCount: campaign._count.codes,
            submissionCount: campaign._count.submissions,
            activation: gate,
            impact
          };
        })
      );

      if (campaigns.length === 0) {
        pipeline[brandStage] += 1;
      } else {
        for (const c of campaigns) {
          pipeline[c.workflowStage] += 1;
        }
      }

      return {
        id: brand.id,
        name: brand.name,
        codePrefix: brand.codePrefix,
        brandWorkflowStage: brandStage,
        brandWorkflowLabel: WORKFLOW_STAGE_LABELS[brandStage],
        onboardingStatus: brand.onboardingStatus,
        primaryContactEmail: brand.primaryContactEmail,
        agreementStatus: brand.agreements[0]?.status ?? null,
        campaigns
      };
    })
  );

  return {
    activationChain: ENTERPRISE_ACTIVATION_CHAIN,
    pipeline,
    brands: items
  };
}
