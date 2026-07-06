import { emptyPlatformLive } from "../../lib/emptyPayloads.js";
import { prisma } from "../../lib/prisma.js";
import { registeredSchoolWhere } from "../../lib/schoolMetrics.js";
import { normalizeProvinceCode, provinceNameFromCode, SA_PROVINCES } from "../analytics/provinces.js";
import { getSchoolRankings, type SchoolRankingRow } from "../schools/schoolParticipation.js";
import { describeCampaignScope } from "../campaigns/campaignEligibility.js";

export type LiveFeedItem = {
  id: string;
  message: string;
  schoolName: string;
  province: string;
  campaignName: string;
  brandName: string;
  createdAt: string;
  ago: string;
};

export type LiveProvinceRow = {
  code: string;
  name: string;
  schools: number;
  submissions: number;
  pct: number;
};

export type LiveCampaignRow = {
  id: string;
  name: string;
  slug: string;
  brandName: string;
  category: string | null;
  infrastructureGoal: string | null;
  validSubmissions: number;
  targetSubmissions: number;
  schoolsParticipating: number;
  percentToTarget: number;
  scopeType: string;
  scopeLabel: string;
  scopeBadge: string;
};

export type PlatformLivePayload = {
  dataSource: "live";
  updatedAt: string;
  stats: {
    /** All registered schools (includes PENDING approval). */
    schoolsRegistered: number;
    /** Schools with at least one verified submission. */
    schoolsParticipating: number;
    /** @deprecated Use schoolsRegistered — kept for older clients. */
    activeSchools: number;
    validSubmissions: number;
    submissionsThisMonth: number;
    provincesActive: number;
    activeCampaigns: number;
  };
  pulse: string[];
  feed: LiveFeedItem[];
  leaderboard: SchoolRankingRow[];
  provinces: LiveProvinceRow[];
  campaigns: LiveCampaignRow[];
};

function formatScopeBadge(scopeType: string, scopeLabel: string): string {
  if (scopeType === "NATIONAL") return "National";
  if (scopeType === "PROVINCIAL") {
    const short = scopeLabel.split(",")[0]?.trim();
    return short ? `${short} only` : "Provincial";
  }
  if (scopeType === "DISTRICT") return "District";
  if (scopeType === "SCHOOL_CLUSTER") return "Selected schools";
  return scopeLabel;
}

function formatAgo(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function buildPulseMessages(input: {
  recentHour: Array<{ school: { name: string; district: string; province: string } }>;
  recentRegistrations: Array<{ name: string; province: string }>;
  campaigns: LiveCampaignRow[];
  provinces: LiveProvinceRow[];
  submissionsThisMonth: number;
  schoolsRegistered: number;
}): string[] {
  const pulse: string[] = [];

  if (input.recentRegistrations.length > 0) {
    const latest = input.recentRegistrations[0];
    pulse.push(
      `✔ ${latest.name} registered on Brand2School (${provinceNameFromCode(normalizeProvinceCode(latest.province))})`
    );
  } else if (input.schoolsRegistered > 0) {
    pulse.push(`✔ ${input.schoolsRegistered.toLocaleString("en-ZA")} schools registered on the platform`);
  }

  const byDistrict = new Map<string, number>();
  for (const row of input.recentHour) {
    const key = row.school.district || row.school.province;
    byDistrict.set(key, (byDistrict.get(key) ?? 0) + 1);
  }
  const topDistrict = [...byDistrict.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topDistrict && topDistrict[1] >= 3) {
    pulse.push(`✔ ${topDistrict[1]} codes verified in ${topDistrict[0]} in the last hour`);
  }

  const milestone = input.campaigns.find((c) => c.percentToTarget >= 50 && c.percentToTarget < 100);
  if (milestone) {
    pulse.push(`✔ ${milestone.name} is ${milestone.percentToTarget}% toward its infrastructure milestone`);
  }
  const completed = input.campaigns.find((c) => c.percentToTarget >= 100);
  if (completed) {
    pulse.push(`✔ Infrastructure milestone reached — ${completed.name}`);
  }

  const topProvince = input.provinces[0];
  if (topProvince && topProvince.submissions >= 100) {
    pulse.push(
      `${topProvince.name} has ${topProvince.submissions.toLocaleString()} verified participations on the platform`
    );
  }

  if (input.submissionsThisMonth >= 100) {
    pulse.push(`${input.submissionsThisMonth.toLocaleString()} verified participations recorded this month`);
  }

  return pulse.slice(0, 5);
}

export async function getPlatformLive(): Promise<PlatformLivePayload> {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      schoolsRegistered,
      registeredSchoolsByProvince,
      recentRegisteredSchools,
      schoolsParticipating,
      validSubmissions,
      submissionsThisMonth,
      activeCampaigns,
      recent,
      recentHour,
      leaderboard,
      allValid,
      campaignsRaw
    ] = await Promise.all([
      prisma.school.count({ where: registeredSchoolWhere }),
      prisma.school.groupBy({
        by: ["province"],
        where: registeredSchoolWhere,
        _count: { id: true }
      }),
      prisma.school.findMany({
        where: registeredSchoolWhere,
        select: { id: true, name: true, province: true, district: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 12
      }),
      prisma.submission
        .findMany({ where: { state: "VALID" }, distinct: ["schoolId"], select: { schoolId: true } })
        .then((rows) => rows.length),
      prisma.submission.count({ where: { state: "VALID" } }),
      prisma.submission.count({ where: { state: "VALID", createdAt: { gte: startOfMonth } } }),
      prisma.campaign.count({ where: { isActive: true } }),
      prisma.submission.findMany({
        where: { state: "VALID" },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          createdAt: true,
          school: { select: { name: true, province: true } },
          campaign: { select: { name: true, brand: { select: { name: true } } } }
        }
      }),
      prisma.submission.findMany({
        where: { state: "VALID", createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
        select: { school: { select: { name: true, district: true, province: true } } }
      }),
      getSchoolRankings(10),
      prisma.submission.findMany({
        where: { state: "VALID" },
        select: {
          schoolId: true,
          school: { select: { province: true } }
        }
      }),
      prisma.campaign.findMany({
        where: { isActive: true },
        include: {
          brand: { select: { name: true } },
          submissions: {
            where: { state: "VALID" },
            select: { schoolId: true }
          }
        },
        orderBy: { startsAt: "desc" },
        take: 6
      })
    ]);

    if (schoolsRegistered === 0 && validSubmissions === 0 && activeCampaigns === 0) {
      return emptyPlatformLive();
    }

    const provinceMap = new Map<string, { registeredSchools: number; submissions: number }>();
    for (const p of SA_PROVINCES) {
      provinceMap.set(p.code, { registeredSchools: 0, submissions: 0 });
    }
    for (const row of registeredSchoolsByProvince) {
      const code = normalizeProvinceCode(row.province);
      const bucket = provinceMap.get(code) ?? { registeredSchools: 0, submissions: 0 };
      bucket.registeredSchools += row._count.id;
      provinceMap.set(code, bucket);
    }
    for (const row of allValid) {
      const code = normalizeProvinceCode(row.school.province);
      const bucket = provinceMap.get(code) ?? { registeredSchools: 0, submissions: 0 };
      bucket.submissions += 1;
      provinceMap.set(code, bucket);
    }

    const maxSubmissions = Math.max(...[...provinceMap.values()].map((v) => v.submissions), 1);
    const provinces: LiveProvinceRow[] = SA_PROVINCES.map((p) => {
      const stats = provinceMap.get(p.code) ?? { registeredSchools: 0, submissions: 0 };
      return {
        code: p.code,
        name: p.name,
        schools: stats.registeredSchools,
        submissions: stats.submissions,
        pct: stats.submissions === 0 ? 0 : Math.round((stats.submissions / maxSubmissions) * 100)
      };
    })
      .filter((p) => p.submissions > 0 || p.schools > 0)
      .sort((a, b) => b.submissions - a.submissions || b.schools - a.schools);

    const provincesActive = [...provinceMap.values()].filter(
      (v) => v.submissions > 0 || v.registeredSchools > 0
    ).length;

    const submissionFeed: LiveFeedItem[] = recent.map((row) => {
      const createdAt = row.createdAt;
      const province = provinceNameFromCode(normalizeProvinceCode(row.school.province));
      const ago = formatAgo(createdAt);
      return {
        id: row.id,
        schoolName: row.school.name,
        province,
        campaignName: row.campaign.name,
        brandName: row.campaign.brand.name,
        createdAt: createdAt.toISOString(),
        ago,
        message: `✔ ${row.campaign.name} verified in ${province} — ${row.school.name} (${ago})`
      };
    });

    const registrationFeed: LiveFeedItem[] = recentRegisteredSchools.slice(0, 8).map((school) => {
      const createdAt = school.createdAt;
      const province = provinceNameFromCode(normalizeProvinceCode(school.province));
      const ago = formatAgo(createdAt);
      return {
        id: `reg-${school.id}`,
        schoolName: school.name,
        province,
        campaignName: "",
        brandName: "",
        createdAt: createdAt.toISOString(),
        ago,
        message: `✔ ${school.name} registered (${school.district}, ${province}) — ${ago}`
      };
    });

    const feed = [...registrationFeed, ...submissionFeed]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20);

    if (feed.length === 0) {
      feed.push({
        id: "welcome",
        message: "Schools are registering — be the first verified participation on Brand2School",
        schoolName: "",
        province: "",
        campaignName: "",
        brandName: "",
        createdAt: new Date().toISOString(),
        ago: "now"
      });
    }

    const campaigns = campaignsRaw.map((c) => {
      const validCount = c.submissions.length;
      const schoolsParticipatingCount = new Set(c.submissions.map((s) => s.schoolId)).size;
      const target = Math.max(c.targetSubmissions, 1);
      const scopeLabel = describeCampaignScope(c);
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        brandName: c.brand.name,
        category: c.category,
        infrastructureGoal: c.infrastructureGoal,
        validSubmissions: validCount,
        targetSubmissions: c.targetSubmissions,
        schoolsParticipating: schoolsParticipatingCount,
        percentToTarget: Math.min(100, Math.round((validCount / target) * 100)),
        scopeType: c.scopeType,
        scopeLabel,
        scopeBadge: formatScopeBadge(c.scopeType, scopeLabel)
      };
    });

    const pulse = buildPulseMessages({
      recentHour,
      recentRegistrations: recentRegisteredSchools,
      campaigns,
      provinces,
      submissionsThisMonth,
      schoolsRegistered
    });

    return {
      dataSource: "live",
      updatedAt: new Date().toISOString(),
      stats: {
        schoolsRegistered,
        schoolsParticipating,
        activeSchools: schoolsRegistered,
        validSubmissions,
        submissionsThisMonth,
        provincesActive,
        activeCampaigns
      },
      pulse,
      feed,
      leaderboard,
      provinces,
      campaigns
    };
  } catch {
    return emptyPlatformLive();
  }
}
