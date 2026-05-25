import { prisma } from "../../lib/prisma.js";
import { normalizeProvinceCode, provinceNameFromCode, SA_PROVINCES } from "../analytics/provinces.js";

const ACTIVE_SCHOOL_STATUSES = ["ACTIVE", "APPROVED", "VERIFIED"] as const;

export function listParticipationProvinces(): Array<{ code: string; name: string }> {
  return SA_PROVINCES.map((p) => ({ code: p.code, name: p.name }));
}

function provinceWhere(province: string) {
  const code = normalizeProvinceCode(province);
  const name = provinceNameFromCode(code);
  return {
    OR: [
      { province: { equals: province.trim(), mode: "insensitive" as const } },
      { province: { equals: name, mode: "insensitive" as const } },
      { province: { equals: code, mode: "insensitive" as const } }
    ]
  };
}

export async function listDistrictsForProvince(province: string): Promise<string[]> {
  const rows = await prisma.school.findMany({
    where: {
      ...provinceWhere(province),
      status: { in: [...ACTIVE_SCHOOL_STATUSES] }
    },
    select: { district: true },
    distinct: ["district"],
    orderBy: { district: "asc" }
  });
  return rows.map((r) => r.district).filter(Boolean);
}

export async function listSchoolsForProvinceDistrict(
  province: string,
  district: string
): Promise<Array<{ id: string; name: string; district: string; province: string }>> {
  return prisma.school.findMany({
    where: {
      ...provinceWhere(province),
      district: { equals: district.trim(), mode: "insensitive" },
      status: { in: [...ACTIVE_SCHOOL_STATUSES] }
    },
    select: { id: true, name: true, district: true, province: true },
    orderBy: { name: "asc" },
    take: 500
  });
}

export async function getParticipationSchoolById(schoolId: string) {
  return prisma.school.findFirst({
    where: {
      id: schoolId,
      status: { in: [...ACTIVE_SCHOOL_STATUSES] }
    }
  });
}
