import { prisma } from "../../lib/prisma.js";

export type LeaderboardPeriod = "today" | "week" | "month" | "all";
export type LeaderboardScope = "national" | "province" | "district";

export type SchoolLeaderboardEntry = {
  rank: number;
  schoolId: string;
  schoolName: string;
  province: string;
  district: string;
  submissions: number;
  isCurrentSchool: boolean;
};

export type SchoolLeaderboardsPayload = {
  period: LeaderboardPeriod;
  scope: LeaderboardScope;
  scopeLabel: string;
  updatedAt: string;
  yourRank: number | null;
  yourSubmissions: number;
  schoolsRanked: number;
  entries: SchoolLeaderboardEntry[];
};

function periodStart(period: LeaderboardPeriod): Date | null {
  if (period === "all") return null;
  const now = new Date();
  if (period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "week") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    return start;
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

const PERIOD_LABEL: Record<LeaderboardPeriod, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
  all: "All time"
};

export function leaderboardPeriodLabel(period: LeaderboardPeriod): string {
  return PERIOD_LABEL[period];
}

async function scopedSchoolIds(
  scope: LeaderboardScope,
  school: { province: string; district: string }
): Promise<Set<string> | null> {
  if (scope === "national") return null;

  const activeStatuses = ["ACTIVE", "APPROVED", "VERIFIED"] as const;

  const where =
    scope === "province"
      ? { province: school.province, status: { in: [...activeStatuses] } }
      : { district: school.district, status: { in: [...activeStatuses] } };

  const rows = await prisma.school.findMany({ where, select: { id: true } });
  return new Set(rows.map((r) => r.id));
}

export async function getSchoolLeaderboard(input: {
  schoolId: string;
  province: string;
  district: string;
  period: LeaderboardPeriod;
  scope: LeaderboardScope;
  limit?: number;
}): Promise<SchoolLeaderboardsPayload> {
  const limit = Math.min(50, Math.max(5, input.limit ?? 25));
  const start = periodStart(input.period);
  const scopeIds = await scopedSchoolIds(input.scope, {
    province: input.province,
    district: input.district
  });

  const grouped = await prisma.submission.groupBy({
    by: ["schoolId"],
    where: {
      state: "VALID",
      ...(start ? { createdAt: { gte: start } } : {}),
      ...(scopeIds ? { schoolId: { in: [...scopeIds] } } : {})
    },
    _count: { _all: true },
    orderBy: { _count: { schoolId: "desc" } }
  });

  const ranked = grouped
    .map((row, index) => ({
      rank: index + 1,
      schoolId: row.schoolId,
      submissions: row._count._all
    }))
    .filter((row) => row.submissions > 0);

  const schoolIds = ranked.map((r) => r.schoolId);
  const schools =
    schoolIds.length > 0
      ? await prisma.school.findMany({
          where: { id: { in: schoolIds } },
          select: { id: true, name: true, province: true, district: true }
        })
      : [];
  const schoolMap = new Map(schools.map((s) => [s.id, s]));

  const yourRow = ranked.find((r) => r.schoolId === input.schoolId) ?? null;

  const scopeLabel =
    input.scope === "national"
      ? "National"
      : input.scope === "province"
        ? input.province
        : input.district;

  const entries: SchoolLeaderboardEntry[] = ranked.slice(0, limit).map((row) => {
    const school = schoolMap.get(row.schoolId);
    return {
      rank: row.rank,
      schoolId: row.schoolId,
      schoolName: school?.name ?? "Unknown school",
      province: school?.province ?? "",
      district: school?.district ?? "",
      submissions: row.submissions,
      isCurrentSchool: row.schoolId === input.schoolId
    };
  });

  if (yourRow && !entries.some((e) => e.isCurrentSchool)) {
    const school = schoolMap.get(yourRow.schoolId);
    entries.push({
      rank: yourRow.rank,
      schoolId: yourRow.schoolId,
      schoolName: school?.name ?? "Your school",
      province: school?.province ?? input.province,
      district: school?.district ?? input.district,
      submissions: yourRow.submissions,
      isCurrentSchool: true
    });
  }

  return {
    period: input.period,
    scope: input.scope,
    scopeLabel,
    updatedAt: new Date().toISOString(),
    yourRank: yourRow?.rank ?? null,
    yourSubmissions: yourRow?.submissions ?? 0,
    schoolsRanked: ranked.length,
    entries
  };
}

export type SchoolLeaderboardsDashboard = {
  defaultPeriod: LeaderboardPeriod;
  periods: LeaderboardPeriod[];
  scopes: LeaderboardScope[];
  boards: Record<`${LeaderboardScope}-${LeaderboardPeriod}`, SchoolLeaderboardsPayload>;
};

export async function getSchoolLeaderboardsDashboard(input: {
  schoolId: string;
  province: string;
  district: string;
}): Promise<SchoolLeaderboardsDashboard> {
  const periods: LeaderboardPeriod[] = ["today", "week", "month", "all"];
  const scopes: LeaderboardScope[] = ["national", "province", "district"];
  const boards = {} as SchoolLeaderboardsDashboard["boards"];

  await Promise.all(
    scopes.flatMap((scope) =>
      periods.map(async (period) => {
        const key = `${scope}-${period}` as keyof SchoolLeaderboardsDashboard["boards"];
        boards[key] = await getSchoolLeaderboard({ ...input, scope, period, limit: 15 });
      })
    )
  );

  return {
    defaultPeriod: "month",
    periods,
    scopes,
    boards
  };
}
