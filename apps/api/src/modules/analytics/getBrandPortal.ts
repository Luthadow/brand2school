import { emptyBrandPortal } from "../../lib/emptyPayloads.js";
import { prisma } from "../../lib/prisma.js";
import { getBrandAnalytics, type BrandAnalytics } from "./getBrandAnalytics.js";
import { normalizeProvinceCode, SA_PROVINCES } from "./provinces.js";

export type PortalCampaign = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "pending" | "completed" | "paused";
  category: string | null;
  infrastructureGoal: string | null;
  targetSubmissions: number;
  validSubmissions: number;
  provinces: string[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

export type SchoolNeed = {
  id: string;
  name: string;
  province: string;
  district: string;
  learnerCount: number;
  priorityNeed: string;
  estimatedCostZar: number;
  progressPercent: number;
  verificationStatus: string;
  imageCategory: string;
};

export type ImpactPipelineItem = {
  id: string;
  schoolName: string;
  codeValue: string;
  stage:
    | "submitted"
    | "verified"
    | "linked"
    | "milestone"
    | "approved"
    | "started"
    | "completed";
  campaignName: string;
  province: string;
  updatedAt: string;
};

export type FinancialSummary = {
  fundsAllocatedZar: number;
  fundsUsedZar: number;
  remainingTargetZar: number;
  verifiedExpensesZar: number;
  platformOperationalZar: number;
  transformationPoolCommittedZar: number;
  transformationPoolUsedZar: number;
  projects: Array<{
    name: string;
    budgetZar: number;
    spentZar: number;
    status: string;
  }>;
};

export type MediaStory = {
  id: string;
  title: string;
  schoolName: string;
  province: string;
  type: "before_after" | "testimonial" | "milestone" | "event";
  excerpt: string;
  imageCategory: string;
  publishedAt: string;
};

export type BrandNotification = {
  id: string;
  title: string;
  body: string;
  type: "milestone" | "campaign" | "project" | "submission";
  createdAt: string;
  read: boolean;
};

export type BrandPortal = {
  brand: { id: string; name: string };
  overview: {
    totalSubmissions: number;
    schoolsSupported: number;
    provincesReached: number;
    infrastructureProjectsFunded: number;
    activeCampaigns: number;
    verifiedSubmissions: number;
    verificationRate: number;
    monthlyGrowthPercent: number;
    estimatedLivesImpacted: number;
    impactValueZar: number;
  };
  analytics: BrandAnalytics;
  campaigns: PortalCampaign[];
  schoolNeeds: SchoolNeed[];
  impactPipeline: ImpactPipelineItem[];
  financials: FinancialSummary;
  media: MediaStory[];
  notifications: BrandNotification[];
};

function campaignStatus(c: { isActive: boolean; startsAt: Date; endsAt: Date }): PortalCampaign["status"] {
  const now = Date.now();
  if (!c.isActive && c.endsAt.getTime() < now) return "completed";
  if (!c.isActive) return "paused";
  if (c.startsAt.getTime() > now) return "pending";
  return "active";
}

function stageFromSubmission(row: {
  state: string;
  createdAt: Date;
  reviewedAt: Date | null;
}): ImpactPipelineItem["stage"] {
  if (row.state === "REJECTED") return "submitted";
  if (!row.reviewedAt) return "verified";
  return "linked";
}

export async function getBrandPortal(campaignId?: string, brandId?: string): Promise<BrandPortal> {
  const analytics = await getBrandAnalytics(campaignId, brandId);

  try {
    const brand = brandId
      ? await prisma.brand.findUnique({
          where: { id: brandId },
          select: {
            id: true,
            name: true,
            subscriptionStatus: true,
            activationFeePaid: true,
            recurringAmountZar: true
          }
        })
      : null;

    const campaignsRaw = await prisma.campaign.findMany({
      where: {
        ...(campaignId ? { id: campaignId } : {}),
        ...(brandId ? { brandId } : {})
      },
      include: {
        submissions: { where: { state: "VALID" }, select: { school: { select: { province: true } } } },
        invoices: { where: { status: "VERIFIED" } }
      },
      orderBy: { startsAt: "desc" }
    });

    if (campaignsRaw.length === 0) {
      return emptyBrandPortal({
        brandId: brand?.id,
        brandName: brand?.name,
        analytics
      });
    }

    const campaigns: PortalCampaign[] = campaignsRaw.map((c) => {
      const provinces = [
        ...new Set(c.submissions.map((s) => normalizeProvinceCode(s.school.province)))
      ];
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        status: campaignStatus(c),
        category: c.category,
        infrastructureGoal: c.infrastructureGoal,
        targetSubmissions: c.targetSubmissions,
        validSubmissions: c.submissions.length,
        provinces,
        startsAt: c.startsAt.toISOString(),
        endsAt: c.endsAt.toISOString(),
        isActive: c.isActive
      };
    });

    const brandSchoolRows = brandId
      ? await prisma.submission.findMany({
          where: { campaign: { brandId }, state: "VALID" },
          select: { schoolId: true },
          distinct: ["schoolId"],
          take: 24
        })
      : [];
    const brandSchoolIds = brandSchoolRows.map((r) => r.schoolId);

    const schools =
      brandSchoolIds.length > 0
        ? await prisma.school.findMany({
            where: { id: { in: brandSchoolIds } },
            include: { _count: { select: { learners: true, submissions: true } } },
            orderBy: { name: "asc" }
          })
        : [];

    const schoolNeeds: SchoolNeed[] = schools.map((s) => ({
      id: s.id,
      name: s.name,
      province: normalizeProvinceCode(s.province),
      district: s.district,
      learnerCount: s._count.learners,
      priorityNeed: s._count.submissions > 0 ? "Verified participation" : "Awaiting first submission",
      estimatedCostZar: 0,
      progressPercent: 0,
      verificationStatus: s.status,
      imageCategory: "libraries"
    }));

    const recentSubmissions = await prisma.submission.findMany({
      where: brandId ? { campaign: { brandId } } : undefined,
      include: {
        school: { select: { name: true, province: true } },
        campaign: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 12
    });

    const impactPipeline: ImpactPipelineItem[] = recentSubmissions.map((s) => ({
      id: s.id,
      schoolName: s.school.name,
      codeValue: s.codeValue,
      stage: stageFromSubmission(s),
      campaignName: s.campaign.name,
      province: normalizeProvinceCode(s.school.province),
      updatedAt: (s.reviewedAt ?? s.createdAt).toISOString()
    }));

    const provincesReached = new Set(
      analytics.provinces.filter((p) => p.submissions > 0).map((p) => p.code)
    ).size;

    const weekly = analytics.weeklyTrend;
    const monthlyGrowthPercent =
      weekly.length >= 2
        ? Math.round(
            ((weekly[weekly.length - 1].submissions - weekly[weekly.length - 2].submissions) /
              Math.max(weekly[weekly.length - 2].submissions, 1)) *
              1000
          ) / 10
        : 0;

    const verifiedSubmissions = analytics.summary.validSubmissions;
    const verificationRate =
      analytics.summary.totalSubmissions > 0
        ? Math.round((verifiedSubmissions / analytics.summary.totalSubmissions) * 1000) / 10
        : 100;

    const platformOperationalZar = campaignsRaw.reduce(
      (sum, c) =>
        sum +
        c.invoices
          .filter((i) => i.invoiceType === "SETUP_FEE" || i.invoiceType === "SAAS_SUBSCRIPTION")
          .reduce((s, i) => s + Number(i.amountZar), 0),
      0
    );
    const transformationPoolCommittedZar = campaignsRaw.reduce(
      (sum, c) => sum + Number(c.contributionPoolZar ?? 0),
      0
    );
    const transformationPoolUsedZar = campaignsRaw.reduce(
      (sum, c) => sum + Number(c.fundingRaisedZar ?? 0),
      0
    );
    const fundsAllocatedZar =
      transformationPoolCommittedZar > 0
        ? transformationPoolCommittedZar
        : Math.round(transformationPoolUsedZar * 1.1);
    const fundsUsedZar = transformationPoolUsedZar;
    const impactValueZar = transformationPoolUsedZar || verifiedSubmissions * Number(campaignsRaw[0]?.contributionPerCodeZar ?? 1);

    const notifications: BrandNotification[] = [];
    if (brand?.subscriptionStatus === "PAST_DUE") {
      notifications.push({
        id: "n-sub-past-due",
        title: "Subscription payment overdue",
        body: "Your enterprise ESG infrastructure subscription is past due. Campaign participation may be limited during the grace period.",
        type: "campaign",
        createdAt: new Date().toISOString(),
        read: false
      });
    }
    if (brand?.subscriptionStatus === "SUSPENDED") {
      notifications.push({
        id: "n-sub-suspended",
        title: "Subscription suspended",
        body: "Campaign participation is paused until your subscription is reactivated. Historical data remains available.",
        type: "campaign",
        createdAt: new Date().toISOString(),
        read: false
      });
    }
    notifications.push({
      id: "n-submissions",
      title: `${formatCount(verifiedSubmissions)} verified submissions`,
      body: `${verificationRate}% verification rate across your active campaigns.`,
      type: "submission",
      createdAt: new Date().toISOString(),
      read: false
    });

    return {
      brand: brand ?? { id: brandId ?? "national", name: analytics.campaigns[0]?.brandName ?? "Brand Partner" },
      overview: {
        totalSubmissions: analytics.summary.totalSubmissions,
        schoolsSupported: analytics.summary.schoolsReached,
        provincesReached: provincesReached || SA_PROVINCES.length,
        infrastructureProjectsFunded: campaigns.length,
        activeCampaigns: analytics.summary.activeCampaigns,
        verifiedSubmissions,
        verificationRate,
        monthlyGrowthPercent,
        estimatedLivesImpacted: analytics.summary.learnersReached * 4,
        impactValueZar
      },
      analytics,
      campaigns,
      schoolNeeds,
      impactPipeline,
      financials: {
        fundsAllocatedZar,
        fundsUsedZar,
        remainingTargetZar: Math.max(0, fundsAllocatedZar - fundsUsedZar),
        verifiedExpensesZar: fundsUsedZar,
        platformOperationalZar,
        transformationPoolCommittedZar,
        transformationPoolUsedZar,
        projects: []
      },
      media: [],
      notifications
    };
  } catch {
    return emptyBrandPortal({ analytics });
  }
}

function formatCount(n: number): string {
  return n.toLocaleString("en-ZA");
}
