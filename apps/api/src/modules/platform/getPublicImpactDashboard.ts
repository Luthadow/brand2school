import { prisma } from "../../lib/prisma.js";
import { registeredSchoolWhere } from "../../lib/schoolMetrics.js";
import { buildPlatformInfrastructureProgress, type InfrastructureProgressMetric } from "../analytics/infrastructureMetrics.js";
import { buildTransformationFunnel } from "../analytics/funnelMetrics.js";
import { computeFraudVelocitySnapshot, detectSuspiciousProvinces } from "../analytics/fraudVelocity.js";
import { normalizeProvinceCode, SA_PROVINCES } from "../analytics/provinces.js";
import { DEVELOPMENT_PHASES } from "../schools/schoolDevelopment.js";
import { listPublicCampaigns } from "./publicCampaigns.js";

export type PublicImpactKpi = {
  key: string;
  label: string;
  value: number;
  format: "count" | "percent";
  hint?: string;
};

export type PublicImpactDashboard = {
  updatedAt: string;
  positioning: string;
  kpis: PublicImpactKpi[];
  fraudGovernance: ReturnType<typeof computeFraudVelocitySnapshot> & {
    openFraudFlags: number;
    provincesUnderReview: number;
  };
  infrastructure: {
    categories: InfrastructureProgressMetric[];
    phaseMaturity: Array<{ phase: number; title: string; schools: number }>;
    averageNationalScore: number;
  };
  provinces: Array<{
    code: string;
    name: string;
    schools: number;
    verifiedParticipations: number;
    intensity: number;
  }>;
  ecosystemFunnel: Array<{ stage: string; count: number }>;
  liveCampaigns: number;
  governanceNotes: string[];
};

export async function getPublicImpactDashboard(): Promise<PublicImpactDashboard> {
  const now = new Date();

  const [
    schoolsRegistered,
    schoolsParticipating,
    validSubmissions,
    activeCampaigns,
    liveCommercialCampaigns,
    openFraudFlags,
    submissions,
    attempts,
    schoolsPhaseRows,
    infrastructureCategories,
    funnel,
    publicCampaigns
  ] = await Promise.all([
    prisma.school.count({ where: registeredSchoolWhere }),
    prisma.submission
      .findMany({ where: { state: "VALID" }, distinct: ["schoolId"], select: { schoolId: true } })
      .then((rows) => rows.length),
    prisma.submission.count({ where: { state: "VALID" } }),
    prisma.campaign.count({ where: { isActive: true } }),
    prisma.campaign.count({ where: { isActive: true, commercialStatus: "LIVE" } }),
    prisma.fraudFlag.count({ where: { status: "OPEN" } }),
    prisma.submission.findMany({
      select: {
        createdAt: true,
        state: true,
        schoolId: true,
        school: { select: { province: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 8000
    }),
    prisma.submissionAttempt.findMany({
      select: { createdAt: true, outcome: true },
      orderBy: { createdAt: "desc" },
      take: 5000
    }),
    prisma.school.findMany({
      select: { currentPhase: true, developmentTier: true },
      take: 2000
    }),
    buildPlatformInfrastructureProgress(),
    buildTransformationFunnel(),
    listPublicCampaigns()
  ]);

  const fraudGovernance = computeFraudVelocitySnapshot(
    submissions.map((s) => ({
      createdAt: s.createdAt,
      state: s.state,
      schoolId: s.schoolId,
      schoolProvince: s.school.province
    })),
    attempts
  );

  const provinceActivity = detectSuspiciousProvinces(
    submissions.map((s) => ({
      createdAt: s.createdAt,
      state: s.state,
      schoolId: s.schoolId,
      schoolProvince: s.school.province
    }))
  );

  const provinceMap = new Map<string, { schools: Set<string>; submissions: number }>();
  for (const p of SA_PROVINCES) provinceMap.set(p.code, { schools: new Set(), submissions: 0 });
  for (const row of submissions) {
    if (row.state !== "VALID") continue;
    const code = normalizeProvinceCode(row.school.province);
    const bucket = provinceMap.get(code) ?? { schools: new Set(), submissions: 0 };
    bucket.submissions += 1;
    bucket.schools.add(row.schoolId);
    provinceMap.set(code, bucket);
  }
  const maxSubmissions = Math.max(...[...provinceMap.values()].map((v) => v.submissions), 1);
  const provinces = SA_PROVINCES.map((p) => {
    const stats = provinceMap.get(p.code) ?? { schools: new Set(), submissions: 0 };
    return {
      code: p.code,
      name: p.name,
      schools: stats.schools.size,
      verifiedParticipations: stats.submissions,
      intensity: Math.round((stats.submissions / maxSubmissions) * 100)
    };
  }).sort((a, b) => b.verifiedParticipations - a.verifiedParticipations);

  const phaseMaturity = DEVELOPMENT_PHASES.map((def) => ({
    phase: def.phase,
    title: def.title,
    schools: schoolsPhaseRows.filter((s) => s.currentPhase === def.phase).length
  }));

  const avgTier =
    schoolsPhaseRows.length > 0
      ? schoolsPhaseRows.reduce((sum, s) => sum + s.developmentTier, 0) / schoolsPhaseRows.length
      : 1;
  const averageNationalScore = Math.min(100, Math.round(avgTier * 18 + phaseMaturity.filter((p) => p.schools > 0).length * 4));

  const kpis: PublicImpactKpi[] = [
    {
      key: "schoolsRegistered",
      label: "Schools registered",
      value: schoolsRegistered,
      format: "count",
      hint: "Includes schools awaiting governance approval"
    },
    {
      key: "schoolsParticipating",
      label: "Schools with verified codes",
      value: schoolsParticipating,
      format: "count",
      hint: "At least one verified participation"
    },
    {
      key: "validSubmissions",
      label: "Verified participations",
      value: validSubmissions,
      format: "count",
      hint: "Audit-ready consumer interactions"
    },
    {
      key: "provincesActive",
      label: "Provinces with activity",
      value: provinces.filter((p) => p.verifiedParticipations > 0).length,
      format: "count"
    },
    {
      key: "liveCampaigns",
      label: "Live transformation campaigns",
      value: liveCommercialCampaigns,
      format: "count",
      hint: `${activeCampaigns} active · ${publicCampaigns.length} public listings`
    },
    {
      key: "fraudCleanRate",
      label: "Fraud-clean verification rate",
      value: fraudGovernance.fraudCleanRatePercent,
      format: "percent",
      hint: "Valid submissions vs total recorded"
    },
    {
      key: "infrastructureCategories",
      label: "Infrastructure categories tracked",
      value: infrastructureCategories.filter((c) => c.schoolsCount > 0 || c.verifiedDeliveries > 0).length,
      format: "count"
    }
  ];

  return {
    updatedAt: now.toISOString(),
    positioning:
      "Brand2School is a governed education transformation ecosystem — we verify, track, measure, and report. We are not a construction company or a donation platform.",
    kpis,
    fraudGovernance: {
      ...fraudGovernance,
      openFraudFlags,
      provincesUnderReview: provinceActivity.filter((p) => p.alert).length
    },
    infrastructure: {
      categories: infrastructureCategories,
      phaseMaturity,
      averageNationalScore
    },
    provinces,
    ecosystemFunnel: funnel,
    liveCampaigns: liveCommercialCampaigns,
    governanceNotes: [
      "All figures are aggregated — no personal learner data is published on this dashboard.",
      "Campaign go-live requires agreement, platform fee verification, approved codes, and rules (commercial governance).",
      "Schools progress through infrastructure phases permanently — they do not exit the ecosystem.",
      "Transformation contribution pools are separate from platform fees and tracked independently.",
      "Open fraud flags are reviewed by administrators before impact is counted in brand reports."
    ]
  };
}
