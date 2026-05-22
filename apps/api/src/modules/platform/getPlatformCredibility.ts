import { prisma } from "../../lib/prisma.js";
import { registeredSchoolWhere } from "../../lib/schoolMetrics.js";
import { countInfrastructureMilestones } from "../analytics/funnelMetrics.js";
import { getBrandTrustMetrics } from "../analytics/getBrandTrustMetrics.js";
import { normalizeProvinceCode } from "../analytics/provinces.js";

export type PublicCredibilityKpi = {
  key: string;
  label: string;
  value: number;
  hint: string;
};

export type PublicCampaignPerformanceRow = {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  submissions: number;
  verificationRate: number;
  engagementRate: number;
  conversionRate: number;
  schoolsParticipating: number;
  isActive: boolean;
};

export type PlatformCredibilityPayload = {
  updatedAt: string;
  kpis: PublicCredibilityKpi[];
  campaignPerformance: PublicCampaignPerformanceRow[];
  fraudBlocked: number;
  protections: string[];
};

export async function getPlatformCredibility(): Promise<PlatformCredibilityPayload> {
  const now = new Date();

  const [
    totalSubmissions,
    verifiedSubmissions,
    schoolsRegistered,
    schoolsImpactedGroups,
    activeCampaigns,
    activeBrands,
    infrastructureMilestones,
    provinceRows,
    campaignsRaw,
    trust
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
    countInfrastructureMilestones(),
    prisma.submission.findMany({
      where: { state: "VALID" },
      select: { school: { select: { province: true } } },
      distinct: ["schoolId"]
    }),
    prisma.campaign.findMany({
      where: { isActive: true },
      include: {
        brand: { select: { name: true } },
        submissions: { select: { state: true, schoolId: true } },
        codeBatches: { include: { codes: { select: { status: true } } } }
      },
      orderBy: { startsAt: "desc" },
      take: 12
    }),
    getBrandTrustMetrics()
  ]);

  const provincesReached = new Set(
    provinceRows.map((row) => normalizeProvinceCode(row.school.province))
  ).size;

  const kpis: PublicCredibilityKpi[] = [
    { key: "schoolsRegistered", label: "Schools registered", value: schoolsRegistered, hint: "Live registrations" },
    { key: "verifiedSubmissions", label: "Verified submissions", value: verifiedSubmissions, hint: "Trust" },
    { key: "schoolsImpacted", label: "Schools with verified codes", value: schoolsImpactedGroups.length, hint: "Participation" },
    { key: "activeCampaigns", label: "Active campaigns", value: activeCampaigns, hint: "Momentum" },
    { key: "activeBrands", label: "Active brand partners", value: activeBrands, hint: "Ecosystem" },
    { key: "fraudBlocked", label: "Fraud blocked", value: trust.fraudAttemptsBlocked, hint: "Integrity" },
    { key: "provincesReached", label: "Provinces reached", value: provincesReached, hint: "National scale" },
    {
      key: "infrastructureMilestones",
      label: "Infrastructure milestones",
      value: infrastructureMilestones,
      hint: "Real impact"
    },
    { key: "totalSubmissions", label: "Total participation events", value: totalSubmissions, hint: "Activity" }
  ];

  const campaignPerformance: PublicCampaignPerformanceRow[] = campaignsRaw.map((campaign) => {
    const total = campaign.submissions.length;
    const valid = campaign.submissions.filter((row) => row.state === "VALID");
    const schoolsParticipating = new Set(valid.map((row) => row.schoolId)).size;
    const codes = campaign.codeBatches.flatMap((batch) => batch.codes);
    const used = codes.filter((code) => code.status === "USED").length;
    const verificationRate = total > 0 ? Math.round((valid.length / total) * 1000) / 10 : 100;
    const engagementRate = codes.length > 0 ? Math.round((used / codes.length) * 1000) / 10 : 0;
    const conversionRate =
      campaign.targetSubmissions > 0
        ? Math.min(100, Math.round((valid.length / campaign.targetSubmissions) * 1000) / 10)
        : 0;

    return {
      id: campaign.id,
      slug: campaign.slug,
      name: campaign.name,
      brandName: campaign.brand.name,
      submissions: total,
      verificationRate,
      engagementRate,
      conversionRate,
      schoolsParticipating,
      isActive: campaign.isActive
    };
  });

  return {
    updatedAt: now.toISOString(),
    kpis,
    campaignPerformance,
    fraudBlocked: trust.fraudAttemptsBlocked,
    protections: [
      "School verification before participation",
      "Code validation against purchase records",
      "Duplicate and fraud detection on submissions",
      "Immutable audit logs for admin actions",
      "POPIA-aligned data handling",
      "Partner logos only with ACTIVE status and admin approval"
    ]
  };
}
