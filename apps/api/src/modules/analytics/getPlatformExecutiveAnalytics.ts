import { prisma } from "../../lib/prisma.js";
import { registeredSchoolWhere } from "../../lib/schoolMetrics.js";
import { normalizeProvinceCode, SA_PROVINCES } from "./provinces.js";
import { getBrandTrustMetrics } from "./getBrandTrustMetrics.js";
import { buildPlatformInfrastructureProgress, type InfrastructureProgressMetric } from "./infrastructureMetrics.js";
import { buildTransformationFunnel, countInfrastructureMilestones, type FunnelStageMetric } from "./funnelMetrics.js";
import {
  buildFraudTrend,
  buildParticipationTrend,
  buildSubmissionTrends,
  type SubmissionTrendSeries
} from "./trendSeries.js";
import { computeFraudVelocitySnapshot, type FraudVelocitySnapshot } from "./fraudVelocity.js";

export type ExecutiveKpi = {
  key: string;
  label: string;
  value: number;
  format: "count" | "percent";
  trendPercent?: number;
};

export type BrandRankingRow = {
  rank: number;
  brandId: string;
  brandName: string;
  validSubmissions: number;
  schoolsReached: number;
  impactScore: number;
};

export type PlatformExecutiveAnalytics = {
  generatedAt: string;
  kpis: ExecutiveKpi[];
  submissionTrend: SubmissionTrendSeries;
  infrastructureProgress: InfrastructureProgressMetric[];
  provinces: Array<{
    code: string;
    name: string;
    submissions: number;
    schools: number;
    intensity: number;
  }>;
  brandRankings: BrandRankingRow[];
  funnel: FunnelStageMetric[];
  channelMix: Array<{ channel: string; count: number; sharePercent: number }>;
  fraudTrend: Array<{ period: string; blocked: number; duplicates: number; flagged: number }>;
  participationTrend: Array<{ period: string; activeParticipants: number; repeatParticipants: number }>;
  campaignPerformance: Array<{
    id: string;
    name: string;
    brandName: string;
    submissions: number;
    verificationRate: number;
    fraudRate: number;
    engagementRate: number;
    conversionRate: number;
  }>;
  liveFeed: Array<{ message: string; createdAt: string }>;
  trust: Awaited<ReturnType<typeof getBrandTrustMetrics>>;
  fraudVelocity: FraudVelocitySnapshot;
};

function intensityFromCount(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((value / max) * 100);
}

function growthPercent(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export async function getPlatformExecutiveAnalytics(): Promise<PlatformExecutiveAnalytics> {
  const now = new Date();
  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const prevMonthStart = new Date(monthStart);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

  const [
    totalSubmissions,
    verifiedSubmissions,
    schoolsRegistered,
    schoolsImpactedGroups,
    activeCampaigns,
    activeBrands,
    provincesWithActivity,
    infrastructureMilestones,
    submissions,
    attempts,
    campaignsRaw,
    brandRows,
    recentAudits,
    trust,
    funnel,
    infrastructureProgress
  ] = await Promise.all([
    prisma.submission.count(),
    prisma.submission.count({ where: { state: "VALID" } }),
    prisma.school.count({ where: registeredSchoolWhere }),
    prisma.submission.groupBy({
      by: ["schoolId"],
      where: { state: "VALID" }
    }),
    prisma.campaign.count({ where: { isActive: true } }),
    prisma.brand.count({ where: { status: "ACTIVE" } }),
    prisma.submission.findMany({
      where: { state: "VALID" },
      select: { school: { select: { province: true } } },
      distinct: ["schoolId"]
    }),
    countInfrastructureMilestones(),
    prisma.submission.findMany({
      select: {
        state: true,
        createdAt: true,
        source: true,
        whatsappMsisdn: true,
        schoolId: true,
        school: { select: { province: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 5000
    }),
    prisma.submissionAttempt.findMany({
      select: { createdAt: true, outcome: true },
      orderBy: { createdAt: "desc" },
      take: 5000
    }),
    prisma.campaign.findMany({
      include: {
        brand: { select: { name: true } },
        submissions: { select: { state: true, schoolId: true } },
        codeBatches: { include: { codes: { select: { status: true } } } }
      },
      orderBy: { startsAt: "desc" },
      take: 40
    }),
    prisma.brand.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        campaigns: {
          select: {
            submissions: {
              where: { state: "VALID" },
              select: { schoolId: true }
            }
          }
        }
      }
    }),
    prisma.auditLog.findMany({
      where: {
        action: {
          in: ["CODE_VERIFIED", "CODE_FLAGGED", "PARTICIPATION_VERIFIED", "ATTEMPT_FRAUD_BLOCKED", "ATTEMPT_DUPLICATE"]
        }
      },
      orderBy: { createdAt: "desc" },
      take: 12
    }),
    getBrandTrustMetrics(),
    buildTransformationFunnel(),
    buildPlatformInfrastructureProgress()
  ]);

  const thisMonthVerified = submissions.filter(
    (row) => row.state === "VALID" && row.createdAt >= monthStart
  ).length;
  const prevMonthVerified = submissions.filter(
    (row) => row.state === "VALID" && row.createdAt >= prevMonthStart && row.createdAt < monthStart
  ).length;

  const provinceMap = new Map<string, { submissions: number; schools: Set<string> }>();
  for (const p of SA_PROVINCES) provinceMap.set(p.code, { submissions: 0, schools: new Set() });
  for (const row of submissions) {
    if (row.state !== "VALID") continue;
    const code = normalizeProvinceCode(row.school.province);
    const bucket = provinceMap.get(code) ?? { submissions: 0, schools: new Set() };
    bucket.submissions += 1;
    bucket.schools.add(row.schoolId);
    provinceMap.set(code, bucket);
  }
  const maxProvince = Math.max(...[...provinceMap.values()].map((v) => v.submissions), 1);
  const provinces = SA_PROVINCES.map((p) => {
    const stats = provinceMap.get(p.code) ?? { submissions: 0, schools: new Set() };
    return {
      code: p.code,
      name: p.name,
      submissions: stats.submissions,
      schools: stats.schools.size,
      intensity: intensityFromCount(stats.submissions, maxProvince)
    };
  });

  const brandRankings: BrandRankingRow[] = brandRows
    .map((brand) => {
      const validSubmissions = brand.campaigns.reduce((sum, c) => sum + c.submissions.length, 0);
      const schoolsReached = new Set(brand.campaigns.flatMap((c) => c.submissions.map((s) => s.schoolId))).size;
      const impactScore = validSubmissions * 2 + schoolsReached * 5;
      return {
        brandId: brand.id,
        brandName: brand.name,
        validSubmissions,
        schoolsReached,
        impactScore
      };
    })
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 12)
    .map((row, index) => ({ rank: index + 1, ...row }));

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

  const campaignPerformance = campaignsRaw.map((campaign) => {
    const total = campaign.submissions.length;
    const valid = campaign.submissions.filter((s) => s.state === "VALID");
    const schools = new Set(valid.map((s) => s.schoolId)).size;
    const codes = campaign.codeBatches.flatMap((b) => b.codes);
    const used = codes.filter((c) => c.status === "USED").length;
    const verificationRate = total > 0 ? Math.round((valid.length / total) * 1000) / 10 : 0;
    const fraudRate = total > 0 ? Math.round(((total - valid.length) / total) * 1000) / 10 : 0;
    const engagementRate = codes.length > 0 ? Math.round((used / codes.length) * 1000) / 10 : 0;
    const conversionRate =
      campaign.targetSubmissions > 0
        ? Math.round((valid.length / campaign.targetSubmissions) * 1000) / 10
        : 0;

    return {
      id: campaign.id,
      name: campaign.name,
      brandName: campaign.brand.name,
      submissions: total,
      verificationRate,
      fraudRate,
      engagementRate,
      conversionRate: Math.min(conversionRate, 100)
    };
  });

  const liveFeed = [
    ...recentAudits.map((row) => ({
      createdAt: row.createdAt.toISOString(),
      message: formatLiveMessage(row.action, row.payload)
    })),
    ...submissions
      .filter((row) => row.state === "VALID")
      .slice(0, 6)
      .map((row) => ({
        createdAt: row.createdAt.toISOString(),
        message: `Verified participation recorded (${row.source ?? "channel"})`
      }))
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  const fraudVelocity = computeFraudVelocitySnapshot(
    submissions.map((s) => ({
      createdAt: s.createdAt,
      state: s.state,
      schoolId: s.schoolId,
      schoolProvince: s.school.province
    })),
    attempts
  );

  const kpis: ExecutiveKpi[] = [
    { key: "schoolsRegistered", label: "Schools registered", value: schoolsRegistered, format: "count" },
    { key: "totalSubmissions", label: "Total submissions", value: totalSubmissions, format: "count", trendPercent: growthPercent(thisMonthVerified, prevMonthVerified) },
    { key: "verifiedSubmissions", label: "Verified submissions", value: verifiedSubmissions, format: "count", trendPercent: growthPercent(thisMonthVerified, prevMonthVerified) },
    { key: "schoolsImpacted", label: "Schools with verified codes", value: schoolsImpactedGroups.length, format: "count" },
    { key: "activeCampaigns", label: "Active campaigns", value: activeCampaigns, format: "count" },
    { key: "activeBrands", label: "Active brands", value: activeBrands, format: "count" },
    { key: "fraudBlocked", label: "Fraud blocked", value: trust.fraudAttemptsBlocked, format: "count" },
    {
      key: "provincesReached",
      label: "Provinces reached",
      value: new Set(provincesWithActivity.map((row) => normalizeProvinceCode(row.school.province))).size,
      format: "count"
    },
    { key: "infrastructureMilestones", label: "Infrastructure milestones", value: infrastructureMilestones, format: "count" },
    {
      key: "fraudVelocityRatio",
      label: "Participation velocity ratio (1h / 7d avg)",
      value: Math.round(fraudVelocity.velocityRatio * 100) / 100,
      format: "count"
    },
    {
      key: "fraudCleanRate",
      label: "Fraud-clean rate",
      value: fraudVelocity.fraudCleanRatePercent,
      format: "percent"
    }
  ];

  return {
    generatedAt: now.toISOString(),
    kpis,
    submissionTrend: buildSubmissionTrends(submissions),
    infrastructureProgress,
    provinces,
    brandRankings,
    funnel,
    channelMix,
    fraudTrend: buildFraudTrend(attempts),
    participationTrend: buildParticipationTrend(submissions),
    campaignPerformance,
    liveFeed,
    trust,
    fraudVelocity
  };
}

function formatLiveMessage(action: string, payload: unknown): string {
  const p = (payload ?? {}) as Record<string, unknown>;
  if (action === "CODE_VERIFIED") {
    return `Code verified for ${String(p.schoolName ?? "a school")}`;
  }
  if (action === "PARTICIPATION_VERIFIED") {
    return `Participation verified in ${String(p.province ?? "a province")}`;
  }
  if (action === "ATTEMPT_FRAUD_BLOCKED") return "Suspicious submission blocked by fraud engine";
  if (action === "ATTEMPT_DUPLICATE") return "Duplicate code attempt rejected";
  if (action === "CODE_FLAGGED") return "Submission flagged for moderator review";
  if (action === "SCHOOL_VERIFICATION_SUBMITTED") {
    return `Verification documents submitted (${String(p.organizationCategory ?? "organisation")})`;
  }
  return action.replace(/_/g, " ").toLowerCase();
}
