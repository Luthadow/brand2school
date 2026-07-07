import { prisma } from "../../lib/prisma.js";
import { publicSchoolProfilePath } from "../platform/publicSchools.js";

export type CommunityLinkedSchool = {
  id: string;
  name: string;
  schoolCode: string;
  province: string;
  district: string;
  verifiedSubmissions: number;
  profileUrl: string | null;
  priorityNeedTitle: string | null;
  nationalRank: number | null;
};

export async function listCommunityLinkedSchools(input: {
  province: string;
  district: string;
  excludeSchoolId: string;
  limit?: number;
}): Promise<CommunityLinkedSchool[]> {
  const limit = Math.min(20, Math.max(1, input.limit ?? 12));

  const rows = await prisma.school.findMany({
    where: {
      province: input.province,
      district: input.district,
      organizationCategory: "SCHOOL",
      id: { not: input.excludeSchoolId },
      status: { in: ["ACTIVE", "APPROVED", "VERIFIED"] },
      verification: { status: "APPROVED" }
    },
    include: {
      verification: { select: { status: true } },
      submittedNeeds: {
        where: { status: { in: ["APPROVED", "UNDER_REVIEW"] } },
        orderBy: { createdAt: "desc" },
        take: 1
      },
      _count: { select: { submissions: { where: { state: "VALID" } } } }
    },
    orderBy: { name: "asc" },
    take: limit
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    schoolCode: row.schoolCode,
    province: row.province,
    district: row.district,
    verifiedSubmissions: row._count.submissions,
    profileUrl: publicSchoolProfilePath(row.schoolCode),
    priorityNeedTitle: row.submittedNeeds[0]?.title ?? null,
    nationalRank: null
  }));
}
