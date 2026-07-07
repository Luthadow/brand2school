import { emptyBrandAnalytics } from "../../lib/emptyPayloads.js";
import { prisma } from "../../lib/prisma.js";
import type { FundAllocations } from "../funding/fundingConversion.js";
import { contributionPerCodeFromCampaign } from "../funding/fundingConversion.js";
import { computeDeliveredImpact } from "../commercial/impactMetrics.js";
import { getBrandAnalytics } from "./getBrandAnalytics.js";
import type { InfrastructureProgressMetric } from "./infrastructureMetrics.js";
import { provinceNameFromCode, normalizeProvinceCode } from "./provinces.js";

export type BrandRoiSummary = {
  totalInvestmentZar: number;
  platformSpendZar: number;
  transformationPoolCommittedZar: number;
  transformationPoolDeployedZar: number;
  codeContributionsZar: number;
  impactValueDeliveredZar: number;
  impactEfficiencyPercent: number;
  verifiedSubmissions: number;
  schoolsReached: number;
  learnersReached: number;
  estimatedConsumerReach: number;
  engagementRate: number;
  verificationRate: number;
  provincesReached: number;
  costPerVerifiedSubmissionZar: number;
  costPerSchoolZar: number;
  costPerThousandReachZar: number;
};

export type BrandRoiFundAllocation = {
  schoolInfrastructure: number;
  operations: number;
  verificationAudits: number;
  growthReserve: number;
};

export type BrandRoiCampaignRow = {
  id: string;
  name: string;
  investmentZar: number;
  impactDeliveredZar: number;
  validSubmissions: number;
  schoolsReached: number;
  costPerVerifiedZar: number;
  progressPercent: number;
  infrastructureMilestones: number;
};

export type BrandRoiProvinceRow = {
  code: string;
  name: string;
  verifiedSubmissions: number;
  schools: number;
  impactZar: number;
  costPerVerifiedZar: number;
};

export type BrandRoiDashboard = {
  generatedAt: string;
  period: { from: string; to: string };
  summary: BrandRoiSummary;
  fundAllocation: BrandRoiFundAllocation;
  campaigns: BrandRoiCampaignRow[];
  provinces: BrandRoiProvinceRow[];
  infrastructureProgress: InfrastructureProgressMetric[];
  participationTrend: Array<{ period: string; activeParticipants: number; repeatParticipants: number }>;
  narrative: {
    headline: string;
    esgLine: string;
    boardSummary: string;
  };
  dataSource: "live";
};

function emptyFundAllocation(): BrandRoiFundAllocation {
  return {
    schoolInfrastructure: 0,
    operations: 0,
    verificationAudits: 0,
    growthReserve: 0
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function safeDivide(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return roundMoney(numerator / denominator);
}

export async function getBrandRoiDashboard(
  campaignId?: string,
  brandId?: string
): Promise<BrandRoiDashboard> {
  const analytics = await getBrandAnalytics(campaignId, brandId);
  const now = new Date();

  if (!brandId && analytics.summary.totalSubmissions === 0) {
    return emptyRoiDashboard(analytics);
  }

  try {
    const campaignWhere = campaignId
      ? { id: campaignId, ...(brandId ? { brandId } : {}) }
      : brandId
        ? { brandId }
        : undefined;

    const campaignsRaw = await prisma.campaign.findMany({
      where: campaignWhere,
      include: {
        invoices: { where: { status: "VERIFIED" } },
        submissions: { where: { state: "VALID" }, select: { schoolId: true } }
      },
      orderBy: { startsAt: "desc" }
    });

    const fundingWhere = campaignId
      ? { campaignId, ...(brandId ? { brandId } : {}) }
      : brandId
        ? { brandId }
        : undefined;

    const fundingRows = await prisma.fundingContribution.findMany({
      where: fundingWhere,
      select: { grossAmountZar: true, allocations: true, campaignId: true }
    });

    const fundAllocation = emptyFundAllocation();
    let codeContributionsZar = 0;
    const impactByCampaign = new Map<string, number>();

    for (const row of fundingRows) {
      const gross = Number(row.grossAmountZar);
      codeContributionsZar += gross;
      impactByCampaign.set(row.campaignId, (impactByCampaign.get(row.campaignId) ?? 0) + gross);

      const allocations = row.allocations as FundAllocations;
      fundAllocation.schoolInfrastructure += allocations.schoolInfrastructure ?? 0;
      fundAllocation.operations += allocations.operations ?? 0;
      fundAllocation.verificationAudits += allocations.verificationAudits ?? 0;
      fundAllocation.growthReserve += allocations.growthReserve ?? 0;
    }

    const platformSpendZar = campaignsRaw.reduce(
      (sum, c) =>
        sum +
        c.invoices
          .filter((i) => i.invoiceType === "SETUP_FEE" || i.invoiceType === "SAAS_SUBSCRIPTION")
          .reduce((s, i) => s + Number(i.amountZar), 0),
      0
    );

    const setupFeesZar = campaignsRaw.reduce((sum, c) => sum + Number(c.setupFeeZar ?? 0), 0);
    const transformationPoolCommittedZar = campaignsRaw.reduce(
      (sum, c) => sum + Number(c.contributionPoolZar ?? 0),
      0
    );
    const transformationPoolDeployedZar = campaignsRaw.reduce(
      (sum, c) => sum + Number(c.fundingRaisedZar ?? 0),
      0
    );

    const platformComponent = platformSpendZar > 0 ? platformSpendZar : setupFeesZar;
    const totalInvestmentZar = roundMoney(
      platformComponent + transformationPoolCommittedZar + codeContributionsZar
    );

    const impactValueDeliveredZar = roundMoney(
      Math.max(
        transformationPoolDeployedZar,
        codeContributionsZar,
        fundAllocation.schoolInfrastructure + fundAllocation.operations + fundAllocation.verificationAudits
      )
    );

    const verifiedSubmissions = analytics.summary.validSubmissions;
    const schoolsReached = analytics.summary.schoolsReached;
    const learnersReached = analytics.summary.learnersReached;
    const estimatedConsumerReach = Math.max(learnersReached * 4, verifiedSubmissions * 3);

    const impactEfficiencyPercent =
      totalInvestmentZar > 0
        ? Math.min(100, Math.round((impactValueDeliveredZar / totalInvestmentZar) * 1000) / 10)
        : 0;

    const summary: BrandRoiSummary = {
      totalInvestmentZar,
      platformSpendZar: platformComponent,
      transformationPoolCommittedZar,
      transformationPoolDeployedZar,
      codeContributionsZar,
      impactValueDeliveredZar,
      impactEfficiencyPercent,
      verifiedSubmissions,
      schoolsReached,
      learnersReached,
      estimatedConsumerReach,
      engagementRate: analytics.summary.engagementRate,
      verificationRate: analytics.summary.verificationRate,
      provincesReached: analytics.summary.provincesReached,
      costPerVerifiedSubmissionZar: safeDivide(totalInvestmentZar, verifiedSubmissions),
      costPerSchoolZar: safeDivide(totalInvestmentZar, schoolsReached),
      costPerThousandReachZar: safeDivide(totalInvestmentZar * 1000, estimatedConsumerReach)
    };

    const campaignRows: BrandRoiCampaignRow[] = await Promise.all(
      campaignsRaw.map(async (c) => {
        const validSubmissions = c.submissions.length;
        const schoolIds = new Set(c.submissions.map((s) => s.schoolId));
        const campaignInvestment = roundMoney(
          Number(c.setupFeeZar ?? 0) +
            Number(c.contributionPoolZar ?? 0) +
            c.invoices
              .filter((i) => i.invoiceType === "SETUP_FEE" || i.invoiceType === "SAAS_SUBSCRIPTION")
              .reduce((s, i) => s + Number(i.amountZar), 0)
        );
        const impactDelivered = roundMoney(
          Math.max(
            Number(c.fundingRaisedZar ?? 0),
            impactByCampaign.get(c.id) ?? 0,
            validSubmissions * contributionPerCodeFromCampaign(c)
          )
        );
        const delivered = await computeDeliveredImpact(c.id);
        const progressPercent =
          c.targetSubmissions > 0
            ? Math.min(100, Math.round((validSubmissions / c.targetSubmissions) * 1000) / 10)
            : 0;

        return {
          id: c.id,
          name: c.name,
          investmentZar: campaignInvestment,
          impactDeliveredZar: impactDelivered,
          validSubmissions,
          schoolsReached: schoolIds.size,
          costPerVerifiedZar: safeDivide(campaignInvestment, validSubmissions),
          progressPercent,
          infrastructureMilestones: delivered.waterPhasesCompleted + delivered.activeInfrastructureProjects
        };
      })
    );

    const totalProvinceSubmissions = analytics.provinces.reduce((sum, p) => sum + p.submissions, 0) || 1;
    const provinces: BrandRoiProvinceRow[] = analytics.provinces
      .filter((p) => p.submissions > 0)
      .map((p) => {
        const share = p.submissions / totalProvinceSubmissions;
        const impactZar = roundMoney(impactValueDeliveredZar * share);
        return {
          code: p.code,
          name: p.name,
          verifiedSubmissions: p.submissions,
          schools: p.schools,
          impactZar,
          costPerVerifiedZar: safeDivide(totalInvestmentZar * share, p.submissions)
        };
      })
      .sort((a, b) => b.verifiedSubmissions - a.verifiedSubmissions);

    const headline =
      totalInvestmentZar > 0
        ? `${impactEfficiencyPercent}% impact efficiency on ${formatZarShort(totalInvestmentZar)} invested`
        : "ROI metrics populate once campaigns and verified submissions begin";

    const esgLine = `We enabled ${verifiedSubmissions.toLocaleString("en-ZA")} verified educational interactions across ${analytics.summary.provincesReached} provinces.`;

    const boardSummary =
      totalInvestmentZar > 0
        ? `For every R1 invested, R${safeDivide(impactValueDeliveredZar, totalInvestmentZar).toFixed(2)} of measurable impact value was delivered. Cost per verified interaction: ${formatZarShort(summary.costPerVerifiedSubmissionZar)}.`
        : "Upload codes and complete campaign activation to unlock board-ready ROI reporting.";

    return {
      generatedAt: now.toISOString(),
      period: analytics.period,
      summary,
      fundAllocation: {
        schoolInfrastructure: roundMoney(fundAllocation.schoolInfrastructure),
        operations: roundMoney(fundAllocation.operations),
        verificationAudits: roundMoney(fundAllocation.verificationAudits),
        growthReserve: roundMoney(fundAllocation.growthReserve)
      },
      campaigns: campaignRows,
      provinces,
      infrastructureProgress: analytics.infrastructureProgress,
      participationTrend: analytics.participationTrend,
      narrative: { headline, esgLine, boardSummary },
      dataSource: "live"
    };
  } catch {
    return emptyRoiDashboard(analytics);
  }
}

function emptyRoiDashboard(analytics = emptyBrandAnalytics()): BrandRoiDashboard {
  return {
    generatedAt: new Date().toISOString(),
    period: analytics.period,
    summary: {
      totalInvestmentZar: 0,
      platformSpendZar: 0,
      transformationPoolCommittedZar: 0,
      transformationPoolDeployedZar: 0,
      codeContributionsZar: 0,
      impactValueDeliveredZar: 0,
      impactEfficiencyPercent: 0,
      verifiedSubmissions: 0,
      schoolsReached: 0,
      learnersReached: 0,
      estimatedConsumerReach: 0,
      engagementRate: 0,
      verificationRate: 0,
      provincesReached: 0,
      costPerVerifiedSubmissionZar: 0,
      costPerSchoolZar: 0,
      costPerThousandReachZar: 0
    },
    fundAllocation: emptyFundAllocation(),
    campaigns: [],
    provinces: [],
    infrastructureProgress: analytics.infrastructureProgress,
    participationTrend: [],
    narrative: {
      headline: "ROI metrics populate once campaigns go live",
      esgLine: "Verified educational interactions will appear here for ESG and board reporting.",
      boardSummary: "Complete campaign setup and verified submissions to unlock ROI intelligence."
    },
    dataSource: "live"
  };
}

function formatZarShort(amount: number): string {
  if (amount >= 1_000_000) return `R${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `R${Math.round(amount / 1_000)}k`;
  return `R${amount.toLocaleString("en-ZA")}`;
}

export { provinceNameFromCode, normalizeProvinceCode };
