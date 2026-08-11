import { prisma } from "../../lib/prisma.js";
import { resolveLogoPublicUrl } from "../../lib/brandStorage.js";
import type { CampaignScopeType } from "../../generated/prisma/index.js";
import { describeCampaignScope, remainingCampaignBudgetZar } from "../campaigns/campaignEligibility.js";
import { getCampaignExpiryBlockReason } from "../commercial/campaignExpiry.js";
import {
  buildCampaignMilestones,
  schoolSupportGeneratedZar,
  type CampaignMilestone
} from "../funding/contributionPerCode.js";
import { contributionPerCodeFromCampaign } from "../funding/fundingConversion.js";

export type PublicCampaignCard = {
  slug: string;
  name: string;
  brandSlug: string;
  brandName: string;
  brandLogoUrl: string | null;
  category: string | null;
  infrastructureGoal: string | null;
  validSubmissions: number;
  targetSubmissions: number;
  schoolsParticipating: number;
  percentToTarget: number;
  isActive: boolean;
  scopeType: string;
  scopeLabel: string;
  eligibleProvinces: string[];
  scopeBadge: string;
  contributionPerCodeZar: string;
  schoolSupportGeneratedZar: string;
};

export type PublicCampaignDetail = PublicCampaignCard & {
  startsAt: string;
  endsAt: string;
  fundingRaisedZar: string;
  brandWebsiteUrl: string | null;
  brandColor: string | null;
  participationHint: string;
  budgetAllocatedZar: number | null;
  remainingBudgetZar: number | null;
  submittedCount: number;
  rejectedCount: number;
  remainingToTarget: number;
  milestones: CampaignMilestone[];
  terminology: {
    generatedLabel: string;
    note: string;
  };
};

function mapCampaignRow(campaign: {
  slug: string;
  name: string;
  category: string | null;
  infrastructureGoal: string | null;
  targetSubmissions: number;
  isActive: boolean;
  startsAt: Date;
  endsAt: Date;
  scopeType: CampaignScopeType;
  allowedProvinces: string[];
  allowedDistricts: string[];
  allowedSchoolIds: string[];
  budgetAllocatedZar: { toString(): string } | null;
  budgetConsumedZar: { toString(): string };
  contributionPerCodeZar: { toString(): string } | number | null;
  fundingRaisedZar: { toString(): string };
  brand: {
    slug: string;
    name: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    brandColor: string | null;
    status: string;
    publicProfileEnabled: boolean;
    featuredOnHome: boolean;
  };
  submissions: Array<{ schoolId: string }>;
}): PublicCampaignCard | null {
  if (campaign.brand.status !== "ACTIVE") return null;

  const validSubmissions = campaign.submissions.length;
  const schoolsParticipating = new Set(campaign.submissions.map((s) => s.schoolId)).size;
  const percentToTarget =
    campaign.targetSubmissions > 0
      ? Math.min(100, Math.round((validSubmissions / campaign.targetSubmissions) * 1000) / 10)
      : 0;
  const perCode = contributionPerCodeFromCampaign({
    contributionPerCodeZar:
      campaign.contributionPerCodeZar == null
        ? null
        : Number(campaign.contributionPerCodeZar)
  });
  const generated = schoolSupportGeneratedZar(validSubmissions, perCode);

  return {
    slug: campaign.slug,
    name: campaign.name,
    brandSlug: campaign.brand.slug,
    brandName: campaign.brand.name,
    brandLogoUrl: resolveLogoPublicUrl(campaign.brand.logoUrl),
    category: campaign.category,
    infrastructureGoal: campaign.infrastructureGoal,
    validSubmissions,
    targetSubmissions: campaign.targetSubmissions,
    schoolsParticipating,
    percentToTarget,
    isActive: campaign.isActive,
    scopeType: campaign.scopeType,
    scopeLabel: describeCampaignScope(campaign),
    eligibleProvinces: campaign.allowedProvinces,
    scopeBadge: formatPublicScopeBadge(campaign.scopeType, describeCampaignScope(campaign)),
    contributionPerCodeZar: perCode.toFixed(2),
    schoolSupportGeneratedZar: generated.toFixed(2)
  };
}

function formatPublicScopeBadge(scopeType: CampaignScopeType, scopeLabel: string): string {
  if (scopeType === "NATIONAL") return "National";
  if (scopeType === "PROVINCIAL") {
    const first = scopeLabel.split(",")[0]?.trim();
    return first ? `${first} only` : "Provincial";
  }
  if (scopeType === "DISTRICT") return "District";
  if (scopeType === "SCHOOL_CLUSTER") return "Selected schools";
  return scopeLabel;
}

export async function listPublicCampaigns(limit = 24): Promise<PublicCampaignCard[]> {
  const campaigns = await prisma.campaign.findMany({
    where: {
      isActive: true,
      brand: { status: "ACTIVE" }
    },
    include: {
      brand: {
        select: {
          slug: true,
          name: true,
          logoUrl: true,
          websiteUrl: true,
          brandColor: true,
          status: true,
          publicProfileEnabled: true,
          featuredOnHome: true
        }
      },
      submissions: {
        where: { state: "VALID" },
        select: { schoolId: true }
      }
    },
    orderBy: { startsAt: "desc" },
    take: limit
  });

  const now = new Date();
  return campaigns
    .filter((c) => !getCampaignExpiryBlockReason(c, now))
    .map((c) =>
      mapCampaignRow({
        ...c,
        brand: { ...c.brand, status: c.brand.status }
      })
    )
    .filter((row): row is PublicCampaignCard => row !== null);
}

export async function getPublicCampaignBySlug(slug: string): Promise<PublicCampaignDetail | null> {
  const campaign = await prisma.campaign.findFirst({
    where: { slug },
    include: {
      brand: {
        select: {
          slug: true,
          name: true,
          logoUrl: true,
          websiteUrl: true,
          brandColor: true,
          status: true,
          publicProfileEnabled: true,
          featuredOnHome: true
        }
      },
      submissions: {
        where: { state: "VALID" },
        select: { schoolId: true }
      },
      _count: {
        select: {
          submissions: true
        }
      }
    }
  });

  if (!campaign) return null;
  if (getCampaignExpiryBlockReason(campaign)) return null;

  const card = mapCampaignRow({
    ...campaign,
    brand: { ...campaign.brand, status: campaign.brand.status }
  });
  if (!card) return null;

  const [rejectedCount, submittedCount] = await Promise.all([
    prisma.submission.count({ where: { campaignId: campaign.id, state: "REJECTED" } }),
    prisma.submission.count({ where: { campaignId: campaign.id } })
  ]);

  const perCode = contributionPerCodeFromCampaign({
    contributionPerCodeZar:
      campaign.contributionPerCodeZar == null
        ? null
        : Number(campaign.contributionPerCodeZar)
  });
  const milestones = buildCampaignMilestones({
    targetSubmissions: campaign.targetSubmissions,
    verifiedCount: card.validSubmissions,
    contributionPerCodeZar: perCode
  });

  return {
    ...card,
    startsAt: campaign.startsAt.toISOString(),
    endsAt: campaign.endsAt.toISOString(),
    fundingRaisedZar: campaign.fundingRaisedZar.toString(),
    brandWebsiteUrl: campaign.brand.websiteUrl,
    brandColor: campaign.brand.brandColor,
    participationHint: buildParticipationHint(campaign),
    budgetAllocatedZar: campaign.budgetAllocatedZar != null ? Number(campaign.budgetAllocatedZar) : null,
    remainingBudgetZar: remainingCampaignBudgetZar(campaign),
    submittedCount,
    rejectedCount,
    remainingToTarget: Math.max(0, campaign.targetSubmissions - card.validSubmissions),
    milestones,
    terminology: {
      generatedLabel: "School Support Generated",
      note: "Generated from verified participations. Delivered only after the brand fulfils the support obligation."
    }
  };
}

function buildParticipationHint(campaign: {
  scopeType: CampaignScopeType;
  allowedProvinces: string[];
  allowedDistricts: string[];
  allowedSchoolIds: string[];
  name: string;
}): string {
  const scope = describeCampaignScope(campaign);
  return [
    "Product codes work nationally — campaign eligibility is based on your school's province and district.",
    `This mission (${campaign.name}) scope: ${scope}.`,
    "Submit online at brand2school.co.za/submit or on WhatsApp (school name, district, campaign slug, product code)."
  ].join(" ");
}
