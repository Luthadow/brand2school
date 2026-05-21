import { emptyBrandAnalytics } from "../../lib/emptyPayloads.js";
import { prisma } from "../../lib/prisma.js";
import { buildTransformationFunnel, type FunnelStageMetric } from "./funnelMetrics.js";
import {
  buildInfrastructureProgressFromCampaigns,
  type InfrastructureProgressMetric
} from "./infrastructureMetrics.js";
import { normalizeProvinceCode, provinceNameFromCode, SA_PROVINCES } from "./provinces.js";
import { getBrandTrustMetrics, type BrandTrustMetrics } from "./getBrandTrustMetrics.js";
import {
  buildFraudTrend,
  buildParticipationTrend,
  buildSubmissionTrends,
  type SubmissionTrendSeries
} from "./trendSeries.js";

export type ProvinceMetric = {
  code: string;
  name: string;
  schools: number;
  learners: number;
  submissions: number;
  intensity: number;
};

export type CampaignMetric = {
  id: string;
  name: string;
  brandName: string;
  isActive: boolean;
  submissions: number;
  validSubmissions: number;
  schoolsReached: number;
  learnersReached: number;
  codeUtilization: number;
  startsAt: string;
  endsAt: string;
};

export type BrandAnalytics = {
  generatedAt: string;
  period: { from: string; to: string };
  summary: {
    totalSubmissions: number;
    validSubmissions: number;
    engagementRate: number;
    schoolsReached: number;
    learnersReached: number;
    activeCampaigns: number;
    codeUtilization: number;
    verificationRate: number;
    provincesReached: number;
  };
  provinces: ProvinceMetric[];
  campaigns: CampaignMetric[];
  weeklyTrend: Array<{ week: string; submissions: number }>;
  submissionTrend: SubmissionTrendSeries;
  infrastructureProgress: InfrastructureProgressMetric[];
  funnel: FunnelStageMetric[];
  channelMix: Array<{ channel: string; count: number; sharePercent: number }>;
  fraudTrend: Array<{ period: string; blocked: number; duplicates: number; flagged: number }>;
  participationTrend: Array<{ period: string; activeParticipants: number; repeatParticipants: number }>;
  topSchools: Array<{ schoolName: string; province: string; submissions: number }>;
  trust: BrandTrustMetrics;
  dataSource: "live";
};

function weekLabel(date: Date): string {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return start.toISOString().slice(0, 10);
}

function intensityFromCount(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((value / max) * 100);
}

export async function getBrandAnalytics(campaignId?: string, brandId?: string): Promise<BrandAnalytics> {
  try {
    const submissionWhere = campaignId
      ? { campaignId, ...(brandId ? { campaign: { brandId } } : {}) }
      : brandId
        ? { campaign: { brandId } }
        : undefined;

    const [submissionCount, validCount, schoolCount, activeCampaigns] = await Promise.all([
      prisma.submission.count(submissionWhere ? { where: submissionWhere } : undefined),
      prisma.submission.count({
        where: { state: "VALID", ...(submissionWhere ?? {}) }
      }),
      prisma.school.count({ where: { status: { in: ["ACTIVE", "APPROVED", "VERIFIED"] } } }),
      prisma.campaign.count({ where: { isActive: true, ...(brandId ? { brandId } : {}) } })
    ]);

    if (submissionCount === 0 && schoolCount === 0 && activeCampaigns === 0) {
      return emptyBrandAnalytics();
    }

    const submissions = await prisma.submission.findMany({
      where: submissionWhere,
      select: {
        state: true,
        createdAt: true,
        schoolId: true,
        source: true,
        whatsappMsisdn: true,
        school: { select: { province: true, name: true } }
      }
    });

    const attemptWhere = campaignId
      ? { campaignSlug: { in: await campaignSlugsForId(campaignId) } }
      : brandId
        ? { campaignSlug: { in: await campaignSlugsForBrand(brandId) } }
        : undefined;

    const attempts = await prisma.submissionAttempt.findMany({
      where: attemptWhere,
      select: { createdAt: true, outcome: true },
      orderBy: { createdAt: "desc" },
      take: 5000
    });

    const provinceMap = new Map<string, { schools: Set<string>; submissions: number }>();
    for (const p of SA_PROVINCES) {
      provinceMap.set(p.code, { schools: new Set(), submissions: 0 });
    }

    const schoolTotals = new Map<string, { name: string; province: string; submissions: number }>();
    const weekMap = new Map<string, number>();

    for (const row of submissions) {
      const code = normalizeProvinceCode(row.school.province);
      const bucket = provinceMap.get(code) ?? { schools: new Set(), submissions: 0 };
      bucket.schools.add(row.schoolId);
      if (row.state === "VALID") bucket.submissions += 1;
      provinceMap.set(code, bucket);

      const schoolKey = row.schoolId;
      const existing = schoolTotals.get(schoolKey) ?? {
        name: row.school.name,
        province: code,
        submissions: 0
      };
      if (row.state === "VALID") existing.submissions += 1;
      schoolTotals.set(schoolKey, existing);

      const wk = weekLabel(row.createdAt);
      weekMap.set(wk, (weekMap.get(wk) ?? 0) + 1);
    }

    const maxSubmissions = Math.max(...[...provinceMap.values()].map((v) => v.submissions), 1);
    const provinces: ProvinceMetric[] = SA_PROVINCES.map((p) => {
      const stats = provinceMap.get(p.code) ?? { schools: new Set(), submissions: 0 };
      return {
        code: p.code,
        name: p.name,
        schools: stats.schools.size,
        learners: stats.submissions,
        submissions: stats.submissions,
        intensity: intensityFromCount(stats.submissions, maxSubmissions)
      };
    });

    const campaignsRaw = await prisma.campaign.findMany({
      where: {
        ...(campaignId ? { id: campaignId } : {}),
        ...(brandId ? { brandId } : {})
      },
      include: {
        brand: true,
        submissions: {
          select: {
            state: true,
            schoolId: true
          }
        },
        codeBatches: { include: { codes: { select: { status: true } } } }
      },
      orderBy: { startsAt: "desc" }
    });

    const campaigns: CampaignMetric[] = campaignsRaw.map((c) => {
      const valid = c.submissions.filter((s) => s.state === "VALID");
      const schoolIds = new Set(valid.map((s) => s.schoolId));
      const codes = c.codeBatches.flatMap((b) => b.codes);
      const usedCodes = codes.filter((code) => code.status === "USED").length;
      const utilization = codes.length > 0 ? Math.round((usedCodes / codes.length) * 1000) / 10 : 0;

      return {
        id: c.id,
        name: c.name,
        brandName: c.brand.name,
        isActive: c.isActive,
        submissions: c.submissions.length,
        validSubmissions: valid.length,
        schoolsReached: schoolIds.size,
        learnersReached: valid.length,
        codeUtilization: utilization,
        startsAt: c.startsAt.toISOString(),
        endsAt: c.endsAt.toISOString()
      };
    });

    const allCodes = await prisma.code.findMany({
      where: campaignId
        ? { batch: { campaignId, ...(brandId ? { campaign: { brandId } } : {}) } }
        : brandId
          ? { batch: { campaign: { brandId } } }
          : undefined,
      select: { status: true }
    });
    const usedAll = allCodes.filter((c) => c.status === "USED").length;
    const codeUtilization = allCodes.length > 0 ? Math.round((usedAll / allCodes.length) * 1000) / 10 : 0;

    const schoolsReached = new Set(
      submissions.filter((s) => s.state === "VALID").map((s) => s.schoolId)
    ).size;
    const participationEvents = validCount;

    const engagementRate =
      submissionCount > 0 ? Math.round((validCount / submissionCount) * 1000) / 10 : 0;

    const now = new Date();
    const from = submissions.length
      ? new Date(Math.min(...submissions.map((s) => s.createdAt.getTime())))
      : new Date(now.getTime() - 90 * 86400000);

    const weeklyTrend = [...weekMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, count], i) => ({ week: `W${i + 1}`, submissions: count }));

    const submissionTrend = buildSubmissionTrends(submissions);
    const fraudTrend = buildFraudTrend(attempts);
    const participationTrend = buildParticipationTrend(submissions);

    const channelTotals = new Map<string, number>();
    for (const row of submissions) {
      const channel = row.source?.toLowerCase().includes("web") ? "Web" : "WhatsApp";
      channelTotals.set(channel, (channelTotals.get(channel) ?? 0) + 1);
    }
    const channelSum = [...channelTotals.values()].reduce((a, b) => a + b, 0) || 1;
    const channelMix = [...channelTotals.entries()].map(([channel, count]) => ({
      channel,
      count,
      sharePercent: Math.round((count / channelSum) * 1000) / 10
    }));

    const infrastructureProgress = buildInfrastructureProgressFromCampaigns(
      campaignsRaw.map((c) => ({
        category: c.category,
        infrastructureGoal: c.infrastructureGoal,
        validSubmissions: c.submissions.filter((s) => s.state === "VALID").length,
        targetSubmissions: c.targetSubmissions
      }))
    );

    const funnel = await buildTransformationFunnel(
      campaignId ? { campaignId, brandId } : brandId ? { brandId } : undefined
    );

    const provincesReached = provinces.filter((p) => p.submissions > 0).length;
    const verificationRate =
      submissionCount > 0 ? Math.round((validCount / submissionCount) * 1000) / 10 : 0;

    const topSchools = [...schoolTotals.values()]
      .sort((a, b) => b.submissions - a.submissions)
      .slice(0, 5)
      .map((s) => ({
        schoolName: s.name,
        province: s.province,
        submissions: s.submissions
      }));

    const trust = await getBrandTrustMetrics(campaignId, brandId);

    return {
      generatedAt: now.toISOString(),
      period: { from: from.toISOString(), to: now.toISOString() },
      summary: {
        totalSubmissions: submissionCount,
        validSubmissions: validCount,
        engagementRate,
        schoolsReached: schoolsReached || schoolCount,
        learnersReached: participationEvents || submissionCount,
        activeCampaigns,
        codeUtilization,
        verificationRate,
        provincesReached
      },
      provinces,
      campaigns,
      weeklyTrend,
      submissionTrend,
      infrastructureProgress,
      funnel,
      channelMix,
      fraudTrend,
      participationTrend,
      topSchools,
      trust,
      dataSource: "live"
    };
  } catch {
    return emptyBrandAnalytics();
  }
}

export function formatReportPeriod(analytics: BrandAnalytics): string {
  const from = new Date(analytics.period.from).toLocaleDateString("en-ZA");
  const to = new Date(analytics.period.to).toLocaleDateString("en-ZA");
  return `${from} – ${to}`;
}

export { provinceNameFromCode };

async function campaignSlugsForBrand(brandId: string): Promise<string[]> {
  const campaigns = await prisma.campaign.findMany({ where: { brandId }, select: { slug: true } });
  return campaigns.map((c) => c.slug);
}

async function campaignSlugsForId(campaignId: string): Promise<string[]> {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { slug: true } });
  return campaign ? [campaign.slug] : [];
}
