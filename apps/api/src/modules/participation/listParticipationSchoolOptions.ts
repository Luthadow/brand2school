import { prisma } from "../../lib/prisma.js";
import {
  districtMatchVariants,
  listCanonicalDistrictsForProvince
} from "../../lib/saDistricts.js";
import { normalizeProvinceCode, provinceNameFromCode, SA_PROVINCES } from "../analytics/provinces.js";

const ACTIVE_SCHOOL_STATUSES = ["ACTIVE", "APPROVED", "VERIFIED"] as const;

export type ParticipationDistrictOption = {
  name: string;
  /** Schools registered in this province + district (ACTIVE / APPROVED / VERIFIED). */
  schoolCount: number;
};

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

function districtWhere(district: string) {
  const variants = districtMatchVariants(district);
  return {
    OR: variants.map((variant) => ({
      district: { equals: variant, mode: "insensitive" as const }
    }))
  };
}

const schoolStatusWhere = { status: { in: [...ACTIVE_SCHOOL_STATUSES] } };

/** Official districts plus DB labels, each with count of registered schools in that province. */
export async function listDistrictsForProvince(province: string): Promise<ParticipationDistrictOption[]> {
  const canonical = listCanonicalDistrictsForProvince(province);

  const rows = await prisma.school.findMany({
    where: {
      ...provinceWhere(province),
      ...schoolStatusWhere
    },
    select: { district: true },
    distinct: ["district"],
    orderBy: { district: "asc" }
  });
  const fromDb = rows.map((r) => r.district).filter(Boolean);

  const names = [...new Set<string>([...canonical, ...fromDb])];
  const options: ParticipationDistrictOption[] = [];

  for (const name of names) {
    const schoolCount = await prisma.school.count({
      where: {
        ...provinceWhere(province),
        ...districtWhere(name),
        ...schoolStatusWhere
      }
    });
    options.push({ name, schoolCount });
  }

  return options.sort((a, b) => {
    if (b.schoolCount !== a.schoolCount) return b.schoolCount - a.schoolCount;
    return a.name.localeCompare(b.name, "en-ZA");
  });
}

/** Schools registered under the selected province and district. */
export async function listSchoolsForProvinceDistrict(
  province: string,
  district: string
): Promise<Array<{ id: string; name: string; district: string; province: string }>> {
  return prisma.school.findMany({
    where: {
      ...provinceWhere(province),
      ...districtWhere(district),
      ...schoolStatusWhere
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
      ...schoolStatusWhere
    }
  });
}
