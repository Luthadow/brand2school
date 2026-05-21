/**
 * Funding Conversion System — micro-contribution per verified code with transparent splits.
 */

import { Prisma } from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";

export const DEFAULT_CONTRIBUTION_PER_CODE_ZAR = 1;

export type FundSplit = {
  schoolInfrastructure: number;
  operations: number;
  verificationAudits: number;
  growthReserve: number;
};

export const DEFAULT_FUND_SPLIT: FundSplit = {
  schoolInfrastructure: 0.7,
  operations: 0.15,
  verificationAudits: 0.1,
  growthReserve: 0.05
};

export type FundAllocations = {
  schoolInfrastructure: number;
  operations: number;
  verificationAudits: number;
  growthReserve: number;
};

export type ImpactTarget = {
  targetAmountZar: number;
  headline: string;
  outcomes: Array<{ label: string; quantity: number; unit?: string }>;
};

export function parseFundSplit(raw: unknown): FundSplit {
  if (!raw || typeof raw !== "object") return DEFAULT_FUND_SPLIT;
  const o = raw as Record<string, number>;
  const total =
    (o.schoolInfrastructure ?? 0) +
    (o.operations ?? 0) +
    (o.verificationAudits ?? 0) +
    (o.growthReserve ?? 0);
  if (total <= 0 || Math.abs(total - 1) > 0.01) return DEFAULT_FUND_SPLIT;
  return {
    schoolInfrastructure: o.schoolInfrastructure ?? DEFAULT_FUND_SPLIT.schoolInfrastructure,
    operations: o.operations ?? DEFAULT_FUND_SPLIT.operations,
    verificationAudits: o.verificationAudits ?? DEFAULT_FUND_SPLIT.verificationAudits,
    growthReserve: o.growthReserve ?? DEFAULT_FUND_SPLIT.growthReserve
  };
}

export function allocateContribution(grossZar: number, split: FundSplit): FundAllocations {
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    schoolInfrastructure: round(grossZar * split.schoolInfrastructure),
    operations: round(grossZar * split.operations),
    verificationAudits: round(grossZar * split.verificationAudits),
    growthReserve: round(grossZar * split.growthReserve)
  };
}

export function contributionPerCodeFromCampaign(campaign: {
  contributionPerCodeZar: Prisma.Decimal | number | null;
}): number {
  if (campaign.contributionPerCodeZar == null) return DEFAULT_CONTRIBUTION_PER_CODE_ZAR;
  return Number(campaign.contributionPerCodeZar);
}

export async function recordVerifiedCodeFunding(input: {
  submissionId: string;
  schoolId: string;
  campaignId: string;
  brandId: string;
}): Promise<{ grossZar: number; allocations: FundAllocations } | null> {
  const existing = await prisma.fundingContribution.findUnique({
    where: { submissionId: input.submissionId }
  });
  if (existing) return null;

  const campaign = await prisma.campaign.findUnique({ where: { id: input.campaignId } });
  if (!campaign) return null;

  const grossZar = contributionPerCodeFromCampaign(campaign);
  const split = parseFundSplit(campaign.fundSplit);
  const allocations = allocateContribution(grossZar, split);

  await prisma.$transaction(async (tx) => {
    await tx.fundingContribution.create({
      data: {
        submissionId: input.submissionId,
        schoolId: input.schoolId,
        campaignId: input.campaignId,
        brandId: input.brandId,
        grossAmountZar: grossZar,
        allocations
      }
    });

    await tx.school.update({
      where: { id: input.schoolId },
      data: {
        fundingBalanceZar: { increment: allocations.schoolInfrastructure }
      }
    });

    const updatedCampaign = await tx.campaign.update({
      where: { id: input.campaignId },
      data: {
        fundingRaisedZar: { increment: grossZar },
        budgetConsumedZar: { increment: grossZar }
      }
    });

    const allocated = updatedCampaign.budgetAllocatedZar != null ? Number(updatedCampaign.budgetAllocatedZar) : 0;
    if (allocated > 0 && updatedCampaign.pauseOnBudgetExhausted) {
      const consumed = Number(updatedCampaign.budgetConsumedZar);
      if (consumed >= allocated) {
        await tx.campaign.update({
          where: { id: input.campaignId },
          data: { isActive: false }
        });
      }
    }
  });

  return { grossZar, allocations };
}

export async function getSchoolFundingLedger(schoolId: string, limit = 20) {
  const [school, rows, totals] = await Promise.all([
    prisma.school.findUnique({
      where: { id: schoolId },
      select: { fundingBalanceZar: true }
    }),
    prisma.fundingContribution.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        campaign: { select: { name: true, slug: true } }
      }
    }),
    prisma.fundingContribution.aggregate({
      where: { schoolId },
      _sum: { grossAmountZar: true }
    })
  ]);

  const splitTotals = { schoolInfrastructure: 0, operations: 0, verificationAudits: 0, growthReserve: 0 };
  for (const row of rows) {
    const a = row.allocations as FundAllocations;
    splitTotals.schoolInfrastructure += a.schoolInfrastructure ?? 0;
    splitTotals.operations += a.operations ?? 0;
    splitTotals.verificationAudits += a.verificationAudits ?? 0;
    splitTotals.growthReserve += a.growthReserve ?? 0;
  }

  return {
    balanceZar: Number(school?.fundingBalanceZar ?? 0),
    lifetimeGrossZar: Number(totals._sum.grossAmountZar ?? 0),
    contributionPerCodeZar: DEFAULT_CONTRIBUTION_PER_CODE_ZAR,
    fundSplit: DEFAULT_FUND_SPLIT,
    recent: rows.map((r) => ({
      id: r.id,
      grossZar: Number(r.grossAmountZar),
      allocations: r.allocations as FundAllocations,
      campaignName: r.campaign.name,
      createdAt: r.createdAt.toISOString()
    })),
    message: "Every verified code contributes R1 (default) to school infrastructure — split transparently."
  };
}

export async function getCampaignFundingSummary(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return null;

  const validCount = await prisma.submission.count({
    where: { campaignId, state: "VALID" }
  });

  const perCode = contributionPerCodeFromCampaign(campaign);
  const impactTarget = (campaign.impactTarget ?? null) as ImpactTarget | null;
  const raised = Number(campaign.fundingRaisedZar ?? 0);
  const target = impactTarget?.targetAmountZar ?? validCount * perCode * 1.2;

  return {
    campaignId,
    campaignName: campaign.name,
    contributionPerCodeZar: perCode,
    fundSplit: parseFundSplit(campaign.fundSplit),
    validSubmissions: validCount,
    fundingRaisedZar: raised,
    theoreticalMaxZar: validCount * perCode,
    impactTarget,
    percentToTarget: target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0
  };
}
