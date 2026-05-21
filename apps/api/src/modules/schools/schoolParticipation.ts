import { prisma } from "../../lib/prisma.js";
import { getSchoolCampaignProgress } from "../participation/services/campaignProgress.js";

export async function getSchoolParticipationProgress(schoolName: string, district: string) {
  const school = await prisma.school.findFirst({
    where: {
      district: { equals: district.trim(), mode: "insensitive" },
      name: { contains: schoolName.trim(), mode: "insensitive" },
      status: { in: ["ACTIVE", "APPROVED", "VERIFIED"] }
    }
  });

  if (!school) return null;

  const campaigns = await prisma.campaign.findMany({
    where: { isActive: true },
    include: { brand: { select: { name: true } } },
    orderBy: { name: "asc" }
  });

  const progress = await Promise.all(
    campaigns.map(async (campaign) => ({
      name: campaign.name,
      slug: campaign.slug,
      brandName: campaign.brand.name,
      category: campaign.category,
      infrastructureGoal: campaign.infrastructureGoal,
      ...(await getSchoolCampaignProgress(school.id, campaign.id, campaign.targetSubmissions))
    }))
  );

  return { school, progress };
}

export type SchoolRankingRow = {
  rank: number;
  schoolId: string;
  schoolName: string;
  province: string;
  district: string;
  submissions: number;
};

export async function getSchoolRankings(limit = 10): Promise<SchoolRankingRow[]> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const grouped = await prisma.submission.groupBy({
    by: ["schoolId"],
    where: {
      state: "VALID",
      createdAt: { gte: startOfMonth }
    },
    _count: { _all: true },
    orderBy: { _count: { schoolId: "desc" } },
    take: limit
  });

  if (grouped.length === 0) return [];

  const schools = await prisma.school.findMany({
    where: { id: { in: grouped.map((g) => g.schoolId) } },
    select: { id: true, name: true, province: true, district: true }
  });

  const schoolMap = new Map(schools.map((s) => [s.id, s]));

  return grouped.map((row, index) => {
    const school = schoolMap.get(row.schoolId);
    return {
      rank: index + 1,
      schoolId: row.schoolId,
      schoolName: school?.name ?? "Unknown school",
      province: school?.province ?? "",
      district: school?.district ?? "",
      submissions: row._count._all
    };
  });
}
