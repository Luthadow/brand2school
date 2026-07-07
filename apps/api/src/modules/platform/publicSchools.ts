import { prisma } from "../../lib/prisma.js";
import { schoolLogoWebPath } from "../../lib/schoolLogo.js";
import { buildSchoolPublicProfile } from "../schools/schoolPublicProfile.js";
import { buildSchoolNeedsEngine } from "../schools/schoolNeedsEngine.js";
import { buildSchoolDevelopmentProfile } from "../schools/schoolDevelopment.js";
import { schoolRecordToStored } from "../schools/syncSchoolInfrastructure.js";
import { buildSchoolBadges, type SchoolBadge } from "../schools/schoolBadges.js";
import { getSchoolRankings } from "../schools/schoolParticipation.js";
import { listUpcomingPublicEvents } from "../schools/schoolEvents.js";
import { listPublicAlumniHighlights } from "../schools/schoolAlumni.js";
import { listPublicEnterpriseHighlights } from "../schools/schoolEnterprise.js";

const PUBLIC_SCHOOL_STATUSES = ["VERIFIED", "APPROVED", "ACTIVE"] as const;

export type PublicSchoolNeed = {
  id: string;
  title: string;
  category: string;
  urgency: string;
  estimatedCostZar: number;
  progressPercent: number;
  sponsorStatus: string;
  learnerImpact: number;
  source: "submitted" | "engine";
};

export type PublicSchoolSummary = {
  schoolCode: string;
  name: string;
  province: string;
  district: string;
  logoUrl: string | null;
  quintile: number | null;
  learnerCount: number;
  teacherCount: number | null;
  profileUrl: string;
  verificationApproved: boolean;
  profileCompletionPercent: number;
  verifiedSubmissions: number;
  nationalRank: number | null;
  priorityNeedTitle: string | null;
  priorityNeedCostZar: number | null;
  openNeedsCount: number;
  badgeCount: number;
  featuredBadges: string[];
};

export type PublicSchoolProfile = PublicSchoolSummary & {
  mission: string;
  vision: string;
  history: string;
  achievements: string[];
  websiteUrl: string | null;
  schoolColours: string[];
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  badges: SchoolBadge[];
  openNeeds: PublicSchoolNeed[];
  participation: {
    verifiedSubmissions: number;
    thisMonth: number;
    learnerCount: number;
  };
  activeCampaigns: Array<{
    name: string;
    brandName: string;
    percentToTarget: number;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    eventTypeLabel: string;
    location: string | null;
    startsAt: string;
  }>;
  alumniHighlights: Array<{
    id: string;
    fullName: string;
    roleLabel: string;
    profession: string | null;
    company: string | null;
    graduationYear: number | null;
  }>;
  enterpriseHighlights: Array<{
    id: string;
    title: string;
    projectTypeLabel: string;
    studentLead: string;
    status: string;
    seekingSponsor: boolean;
  }>;
};

export function publicSchoolProfilePath(schoolCode: string): string {
  return `/schools/${encodeURIComponent(schoolCode)}`;
}

function needImageCategory(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("tech") || c.includes("computer") || c.includes("wifi")) return "technology";
  if (c.includes("sport")) return "sports";
  if (c.includes("nutrition") || c.includes("feeding")) return "feeding-scheme";
  if (c.includes("science")) return "science-lab";
  if (c.includes("classroom") || c.includes("infrastructure") || c.includes("roof")) return "classrooms";
  return "libraries";
}

export function schoolMarketplaceImageCategory(category: string): string {
  return needImageCategory(category);
}

function isSchoolPublic(row: {
  status: string;
  verification: { status: string } | null;
  profileCompletionPercent: number;
}): boolean {
  const statusOk = PUBLIC_SCHOOL_STATUSES.includes(row.status as (typeof PUBLIC_SCHOOL_STATUSES)[number]);
  const verified = row.verification?.status === "APPROVED";
  return statusOk && verified && row.profileCompletionPercent >= 25;
}

type SchoolRow = Awaited<ReturnType<typeof fetchPublicSchoolRows>>[number];

async function fetchPublicSchoolRows(options?: {
  province?: string;
  quintile?: number;
  q?: string;
  limit?: number;
}) {
  const limit = Math.min(60, Math.max(1, options?.limit ?? 40));
  const q = options?.q?.trim();

  return prisma.school.findMany({
    where: {
      status: { in: [...PUBLIC_SCHOOL_STATUSES] },
      verification: { status: "APPROVED" },
      ...(options?.province ? { province: options.province } : {}),
      ...(options?.quintile ? { quintile: options.quintile } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { district: { contains: q, mode: "insensitive" } },
              { schoolCode: { contains: q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    include: {
      verification: { select: { status: true, emisNumber: true, registrationNumber: true } },
      _count: { select: { learners: true, submissions: { where: { state: "VALID" } }, submittedNeeds: true } },
      submittedNeeds: {
        where: { status: { in: ["APPROVED", "FUNDED", "UNDER_REVIEW"] } },
        orderBy: { estimatedCostZar: "desc" },
        take: 3
      }
    },
    orderBy: [{ name: "asc" }],
    take: limit
  });
}

async function buildSummaryFromRow(
  row: SchoolRow,
  nationalRankMap: Map<string, number>
): Promise<PublicSchoolSummary | null> {
  const profile = buildSchoolPublicProfile({
    logoUrl: row.logoUrl,
    websiteUrl: row.websiteUrl,
    publicPhone: row.publicPhone,
    quintile: row.quintile,
    teacherCount: row.teacherCount,
    gpsLat: row.gpsLat,
    gpsLng: row.gpsLng,
    publicProfile: row.publicProfile,
    schoolCode: row.schoolCode,
    principalName: row.principalName,
    contactEmail: row.contactEmail,
    province: row.province,
    district: row.district
  });

  if (!isSchoolPublic({ status: row.status, verification: row.verification, profileCompletionPercent: profile.completionPercent })) {
    return null;
  }

  const prioritySubmitted = row.submittedNeeds[0];
  const openNeedsCount = row.submittedNeeds.length;

  const badges = buildSchoolBadges({
    validSubmissions: row._count.submissions,
    verificationStatus: row.verification?.status ?? "NOT_SUBMITTED",
    verificationScorePercent: row.verification?.status === "APPROVED" ? 85 : 50,
    profileCompletionPercent: profile.completionPercent,
    nationalRank: nationalRankMap.get(row.id) ?? null,
    provinceRank: null,
    districtRank: null,
    targets: [],
    submittedNeedsCount: row._count.submittedNeeds,
    completedPhases: row.currentPhase > 1 ? row.currentPhase - 1 : 0,
    schoolCreatedAt: row.createdAt
  });

  return {
    schoolCode: row.schoolCode,
    name: row.name,
    province: row.province,
    district: row.district,
    logoUrl: profile.logoUrl,
    quintile: row.quintile,
    learnerCount: row._count.learners,
    teacherCount: row.teacherCount,
    profileUrl: publicSchoolProfilePath(row.schoolCode),
    verificationApproved: true,
    profileCompletionPercent: profile.completionPercent,
    verifiedSubmissions: row._count.submissions,
    nationalRank: nationalRankMap.get(row.id) ?? null,
    priorityNeedTitle: prioritySubmitted?.title ?? null,
    priorityNeedCostZar: prioritySubmitted?.estimatedCostZar ?? null,
    openNeedsCount,
    badgeCount: badges.earnedCount,
    featuredBadges: badges.featured.map((b) => b.label)
  };
}

export async function listPublicSchools(options?: {
  province?: string;
  quintile?: number;
  q?: string;
  limit?: number;
}): Promise<PublicSchoolSummary[]> {
  const rows = await fetchPublicSchoolRows(options);
  const rankings = await getSchoolRankings(100);
  const nationalRankMap = new Map(rankings.map((r) => [r.schoolId, r.rank]));

  const summaries = await Promise.all(rows.map((row) => buildSummaryFromRow(row, nationalRankMap)));
  return summaries.filter((s): s is PublicSchoolSummary => s != null);
}

export async function getPublicSchoolByCode(schoolCode: string): Promise<PublicSchoolProfile | null> {
  const row = await prisma.school.findFirst({
    where: { schoolCode },
    include: {
      verification: true,
      _count: { select: { learners: true, submissions: { where: { state: "VALID" } }, submittedNeeds: true } },
      submittedNeeds: {
        where: { status: { in: ["APPROVED", "FUNDED", "UNDER_REVIEW"] } },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!row) return null;

  const profile = buildSchoolPublicProfile({
    logoUrl: row.logoUrl,
    websiteUrl: row.websiteUrl,
    publicPhone: row.publicPhone,
    quintile: row.quintile,
    teacherCount: row.teacherCount,
    gpsLat: row.gpsLat,
    gpsLng: row.gpsLng,
    publicProfile: row.publicProfile,
    schoolCode: row.schoolCode,
    principalName: row.principalName,
    contactEmail: row.contactEmail,
    province: row.province,
    district: row.district
  });

  if (!isSchoolPublic({ status: row.status, verification: row.verification, profileCompletionPercent: profile.completionPercent })) {
    return null;
  }

  const validSubmissions = row._count.submissions;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const thisMonth = await prisma.submission.count({
    where: { schoolId: row.id, state: "VALID", createdAt: { gte: startOfMonth } }
  });

  const development = buildSchoolDevelopmentProfile({
    schoolId: row.id,
    schoolName: row.name,
    validSubmissions,
    stored: schoolRecordToStored({
      id: row.id,
      name: row.name,
      province: row.province,
      district: row.district,
      principalName: row.principalName,
      contactEmail: row.contactEmail,
      currentPhase: row.currentPhase,
      developmentTier: row.developmentTier,
      developmentScores: row.developmentScores,
      phaseHistory: row.phaseHistory,
      infrastructureItems: row.infrastructureItems,
      annualCycleYear: row.annualCycleYear,
      annualCycleFocus: row.annualCycleFocus
    })
  });

  const engineNeeds = buildSchoolNeedsEngine(development)
    .filter((n) => n.progressPercent < 100)
    .slice(0, 4)
    .map((n) => ({
      id: n.id,
      title: n.category,
      category: n.statusLabel,
      urgency: n.priority,
      estimatedCostZar: n.estimatedCostZar,
      progressPercent: n.progressPercent,
      sponsorStatus: "Open for sponsorship",
      learnerImpact: Math.round(n.progressPercent * 3) || 50,
      source: "engine" as const
    }));

  const submittedNeeds: PublicSchoolNeed[] = row.submittedNeeds.map((n) => ({
    id: n.id,
    title: n.title,
    category: `${n.category} · ${n.subcategory}`,
    urgency: n.urgency,
    estimatedCostZar: n.estimatedCostZar,
    progressPercent: n.progressPercent,
    sponsorStatus: n.sponsorStatus,
    learnerImpact: n.learnerImpact,
    source: "submitted"
  }));

  const openNeeds = [...submittedNeeds, ...engineNeeds].slice(0, 12);

  const rankings = await getSchoolRankings(100);
  const nationalRank = rankings.find((r) => r.schoolId === row.id)?.rank ?? null;

  const badges = buildSchoolBadges({
    validSubmissions,
    verificationStatus: row.verification?.status ?? "NOT_SUBMITTED",
    verificationScorePercent: 90,
    profileCompletionPercent: profile.completionPercent,
    nationalRank,
    provinceRank: null,
    districtRank: null,
    targets: [],
    submittedNeedsCount: row._count.submittedNeeds,
    completedPhases: development.phases.filter((p) => p.status === "completed").length,
    schoolCreatedAt: row.createdAt
  });

  const activeCampaigns = await prisma.campaign.findMany({
    where: { isActive: true },
    include: {
      brand: { select: { name: true } },
      submissions: { where: { schoolId: row.id, state: "VALID" }, select: { id: true } }
    },
    take: 6
  });

  const campaignCards = activeCampaigns
    .filter((c) => c.submissions.length > 0)
    .map((c) => ({
      name: c.name,
      brandName: c.brand.name,
      percentToTarget: Math.min(
        100,
        Math.round((c.submissions.length / Math.max(c.targetSubmissions, 1)) * 100)
      )
    }));

  const summary = await buildSummaryFromRow(
    {
      ...row,
      submittedNeeds: row.submittedNeeds.slice(0, 3)
    } as SchoolRow,
    new Map(rankings.map((r) => [r.schoolId, r.rank]))
  );

  if (!summary) return null;

  const upcomingEvents = await listUpcomingPublicEvents(row.id);
  const [alumniHighlights, enterpriseHighlights] = await Promise.all([
    listPublicAlumniHighlights(row.id),
    listPublicEnterpriseHighlights(row.id)
  ]);

  return {
    ...summary,
    mission: profile.mission,
    vision: profile.vision,
    history: profile.history,
    achievements: profile.achievements,
    websiteUrl: profile.websiteUrl,
    schoolColours: profile.schoolColours,
    socialMedia: profile.socialMedia ?? {},
    badges: badges.badges.filter((b) => b.earned),
    openNeeds,
    participation: {
      verifiedSubmissions: validSubmissions,
      thisMonth,
      learnerCount: row._count.learners
    },
    activeCampaigns: campaignCards,
    upcomingEvents,
    alumniHighlights,
    enterpriseHighlights
  };
}

export function evaluateSchoolPublicVisibility(input: {
  status: string;
  verificationStatus: string;
  profileCompletionPercent: number;
}): { visible: boolean; url: string | null; message: string } {
  const statusOk = PUBLIC_SCHOOL_STATUSES.includes(input.status as (typeof PUBLIC_SCHOOL_STATUSES)[number]);
  const verified = input.verificationStatus === "APPROVED";
  const profileOk = input.profileCompletionPercent >= 25;

  if (!verified) {
    return { visible: false, url: null, message: "Complete verification to publish your public profile." };
  }
  if (!statusOk) {
    return { visible: false, url: null, message: "Your school must be approved before going public." };
  }
  if (!profileOk) {
    return {
      visible: false,
      url: null,
      message: `Reach 25% profile completion to publish (currently ${input.profileCompletionPercent}%).`
    };
  }
  return { visible: true, url: null, message: "Your school is visible in the marketplace." };
}
