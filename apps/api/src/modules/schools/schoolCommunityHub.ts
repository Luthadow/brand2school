import { prisma } from "../../lib/prisma.js";
import { publicSchoolProfilePath } from "../platform/publicSchools.js";

export type CommunitySupporter = {
  name: string;
  type: "Learners" | "Parents" | "Community" | "Other";
  submissions: number;
  sharePercent: number;
};

export type CommunityOrganisationLink = {
  id: string;
  name: string;
  organizationCategory: string;
  organizationLabel: string;
  schoolCode: string;
  profileUrl: string | null;
  verifiedSubmissions: number;
};

export type SchoolCommunityHub = {
  engagementScore: number;
  stats: {
    totalAreas: number;
    learnerSubmissions: number;
    communitySubmissions: number;
    learnerSharePercent: number;
    submissionsPerLearner: number;
    districtAvgSubmissions: number;
    districtRank: number | null;
    uniqueParticipants: number;
    monthGrowthPercent: number;
    thisMonth: number;
    lastMonth: number;
  };
  supporters: CommunitySupporter[];
  areaBreakdown: Array<{ area: string; count: number; type: string }>;
  weekdayActivity: Array<{ day: string; count: number }>;
  linkedOrganisations: CommunityOrganisationLink[];
  shareKit: {
    schoolCode: string;
    whatsappPhone: string;
    messageTemplates: string[];
  };
  recommendations: Array<{ id: string; message: string; priority: "high" | "medium" | "low" }>;
};

const ORG_LABEL: Record<string, string> = {
  SCHOOL: "School",
  NGO_NPO: "NGO / NPO",
  COMMUNITY: "Community",
  FAITH: "Faith"
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function classifyArea(area: string): CommunitySupporter["type"] {
  const a = area.toLowerCase();
  if (a.includes("grade") || a.includes("learner")) return "Learners";
  if (a.includes("parent") || a.includes("guardian")) return "Parents";
  if (a === "community" || a.includes("ward") || a.includes("church") || a.includes("club")) {
    return "Community";
  }
  return "Other";
}

function engagementScore(input: {
  validSubmissions: number;
  learnerCount: number;
  uniqueParticipants: number;
  totalAreas: number;
  monthGrowthPercent: number;
}): number {
  const participation = Math.min(100, Math.round((input.validSubmissions / Math.max(input.learnerCount, 1)) * 25));
  const breadth = Math.min(100, input.totalAreas * 12);
  const reach = Math.min(100, input.uniqueParticipants * 4);
  const momentum = Math.min(100, 50 + input.monthGrowthPercent);
  return Math.round(participation * 0.35 + breadth * 0.25 + reach * 0.2 + momentum * 0.2);
}

export async function buildSchoolCommunityHub(input: {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  whatsappPhone: string;
  province: string;
  district: string;
  learnerCount: number;
  organizationCategory: string;
}): Promise<SchoolCommunityHub> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const submissions = await prisma.submission.findMany({
    where: { schoolId: input.schoolId, state: "VALID" },
    select: { area: true, createdAt: true, whatsappMsisdn: true },
    orderBy: { createdAt: "desc" },
    take: 500
  });

  const thisMonth = submissions.filter((s) => s.createdAt >= startOfMonth).length;
  const lastMonth = submissions.filter(
    (s) => s.createdAt >= startOfLastMonth && s.createdAt <= endOfLastMonth
  ).length;
  const monthGrowthPercent =
    lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : thisMonth > 0 ? 100 : 0;

  const areaCounts = new Map<string, number>();
  let learnerSubmissions = 0;
  let communitySubmissions = 0;

  for (const row of submissions) {
    const area = row.area?.trim() || "Community";
    areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1);
    const type = classifyArea(area);
    if (type === "Learners") learnerSubmissions += 1;
    else communitySubmissions += 1;
  }

  const totalValid = submissions.length;
  const learnerSharePercent =
    totalValid > 0 ? Math.round((learnerSubmissions / totalValid) * 100) : 0;

  const supporters: CommunitySupporter[] = [...areaCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({
      name,
      type: classifyArea(name),
      submissions: count,
      sharePercent: totalValid > 0 ? Math.round((count / totalValid) * 100) : 0
    }));

  const areaBreakdown = supporters.map((s) => ({
    area: s.name,
    count: s.submissions,
    type: s.type
  }));

  const weekdayMap = new Map<number, number>();
  for (const row of submissions) {
    const d = row.createdAt.getDay();
    weekdayMap.set(d, (weekdayMap.get(d) ?? 0) + 1);
  }
  const weekdayActivity = WEEKDAYS.map((day, index) => ({
    day,
    count: weekdayMap.get(index) ?? 0
  }));

  const uniqueParticipants = new Set(
    submissions.map((s) => s.whatsappMsisdn).filter((v): v is string => Boolean(v))
  ).size;

  const districtSchools = await prisma.school.findMany({
    where: {
      district: input.district,
      status: { in: ["ACTIVE", "APPROVED", "VERIFIED"] }
    },
    select: { id: true }
  });
  const districtIds = districtSchools.map((s) => s.id);

  const districtGrouped =
    districtIds.length > 0
      ? await prisma.submission.groupBy({
          by: ["schoolId"],
          where: {
            schoolId: { in: districtIds },
            state: "VALID",
            createdAt: { gte: startOfMonth }
          },
          _count: { _all: true },
          orderBy: { _count: { schoolId: "desc" } }
        })
      : [];

  const districtAvgSubmissions =
    districtGrouped.length > 0
      ? Math.round(
          districtGrouped.reduce((sum, g) => sum + g._count._all, 0) / districtGrouped.length
        )
      : 0;

  const districtRank =
    districtGrouped.findIndex((g) => g.schoolId === input.schoolId) >= 0
      ? districtGrouped.findIndex((g) => g.schoolId === input.schoolId) + 1
      : null;

  const linkedRows = await prisma.school.findMany({
    where: {
      district: input.district,
      province: input.province,
      id: { not: input.schoolId },
      organizationCategory: { in: ["NGO_NPO", "COMMUNITY", "FAITH"] },
      status: { in: ["ACTIVE", "APPROVED", "VERIFIED"] },
      verification: { status: "APPROVED" }
    },
    select: {
      id: true,
      name: true,
      schoolCode: true,
      organizationCategory: true,
      _count: { select: { submissions: { where: { state: "VALID" } } } }
    },
    take: 8,
    orderBy: { name: "asc" }
  });

  const linkedOrganisations: CommunityOrganisationLink[] = linkedRows.map((row) => ({
    id: row.id,
    name: row.name,
    organizationCategory: row.organizationCategory,
    organizationLabel: ORG_LABEL[row.organizationCategory] ?? row.organizationCategory,
    schoolCode: row.schoolCode,
    profileUrl: publicSchoolProfilePath(row.schoolCode),
    verifiedSubmissions: row._count.submissions
  }));

  const stats = {
    totalAreas: areaCounts.size,
    learnerSubmissions,
    communitySubmissions,
    learnerSharePercent,
    submissionsPerLearner:
      input.learnerCount > 0 ? Math.round((totalValid / input.learnerCount) * 10) / 10 : 0,
    districtAvgSubmissions,
    districtRank,
    uniqueParticipants,
    monthGrowthPercent,
    thisMonth,
    lastMonth
  };

  const score = engagementScore({
    validSubmissions: totalValid,
    learnerCount: input.learnerCount,
    uniqueParticipants,
    totalAreas: areaCounts.size,
    monthGrowthPercent
  });

  const recommendations: SchoolCommunityHub["recommendations"] = [];
  if (totalValid === 0) {
    recommendations.push({
      id: "first-community",
      priority: "high",
      message: "Share your school code on WhatsApp groups — SGB, parents, and local clubs."
    });
  }
  if (learnerSharePercent < 40 && totalValid > 10) {
    recommendations.push({
      id: "engage-learners",
      priority: "medium",
      message: "Run a classroom code drive — learner participation strengthens campaign targets."
    });
  }
  if (areaCounts.size < 3 && totalValid > 0) {
    recommendations.push({
      id: "broaden-areas",
      priority: "medium",
      message: "Invite more community segments (parents, sports, faith groups) to submit codes."
    });
  }
  if (linkedOrganisations.length === 0) {
    recommendations.push({
      id: "partner-org",
      priority: "low",
      message: "Connect with a local NGO or community organisation in your district on Brand2School."
    });
  }
  if (monthGrowthPercent < 0) {
    recommendations.push({
      id: "momentum",
      priority: "high",
      message: "Participation dipped this month — send a reminder on WhatsApp with your school code."
    });
  }

  const orgShort =
    input.organizationCategory === "COMMUNITY"
      ? "community organisation"
      : input.organizationCategory === "NGO_NPO"
        ? "organisation"
        : "school";

  return {
    engagementScore: score,
    stats,
    supporters,
    areaBreakdown,
    weekdayActivity,
    linkedOrganisations,
    shareKit: {
      schoolCode: input.schoolCode,
      whatsappPhone: input.whatsappPhone,
      messageTemplates: [
        `Support ${input.schoolName}! Buy participating products and submit your code on WhatsApp to ${input.whatsappPhone}. School code: ${input.schoolCode}`,
        `Every code helps our ${orgShort} unlock real infrastructure. Code: ${input.schoolCode} · WhatsApp ${input.whatsappPhone}`,
        `Join the Brand2School movement for ${input.district} — verified participation, measurable impact. School code ${input.schoolCode}`
      ]
    },
    recommendations: recommendations.slice(0, 4)
  };
}

export type PublicCommunityStats = {
  schoolCode: string;
  schoolName: string;
  engagementScore: number;
  totalParticipation: number;
  learnerSharePercent: number;
  topSupporters: Array<{ name: string; type: string; submissions: number }>;
  weekdayActivity: Array<{ day: string; count: number }>;
};

export async function getPublicSchoolCommunityStats(
  schoolCode: string
): Promise<PublicCommunityStats | null> {
  const school = await prisma.school.findFirst({
    where: { schoolCode },
    select: {
      id: true,
      name: true,
      schoolCode: true,
      whatsappPhone: true,
      province: true,
      district: true,
      organizationCategory: true,
      status: true,
      _count: { select: { learners: true } }
    }
  });
  if (!school || !["ACTIVE", "APPROVED", "VERIFIED"].includes(school.status)) return null;

  const hub = await buildSchoolCommunityHub({
    schoolId: school.id,
    schoolName: school.name,
    schoolCode: school.schoolCode,
    whatsappPhone: school.whatsappPhone,
    province: school.province,
    district: school.district,
    learnerCount: school._count.learners,
    organizationCategory: school.organizationCategory
  });

  return {
    schoolCode: school.schoolCode,
    schoolName: school.name,
    engagementScore: hub.engagementScore,
    totalParticipation: hub.stats.learnerSubmissions + hub.stats.communitySubmissions,
    learnerSharePercent: hub.stats.learnerSharePercent,
    topSupporters: hub.supporters.slice(0, 5).map((s) => ({
      name: s.name,
      type: s.type,
      submissions: s.submissions
    })),
    weekdayActivity: hub.weekdayActivity
  };
}
