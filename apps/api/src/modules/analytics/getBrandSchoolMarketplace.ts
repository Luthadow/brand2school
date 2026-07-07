import { prisma } from "../../lib/prisma.js";
import { listPublicSchools, schoolMarketplaceImageCategory } from "../platform/publicSchools.js";
import type { SchoolNeed } from "./getBrandPortal.js";

export type BrandMarketplaceSchool = SchoolNeed & {
  schoolCode: string;
  profileUrl: string;
  quintile: number | null;
  verifiedSubmissions: number;
  nationalRank: number | null;
  openNeedsCount: number;
  featuredBadges: string[];
  partnerSchool: boolean;
  needs: Array<{
    id: string;
    title: string;
    category: string;
    urgency: string;
    estimatedCostZar: number;
    progressPercent: number;
    sponsorStatus: string;
    source: string;
  }>;
};

export type BrandSchoolMarketplace = {
  summary: {
    totalSchools: number;
    withOpenNeeds: number;
    partnerSchools: number;
  };
  schools: BrandMarketplaceSchool[];
};

export async function getBrandSchoolMarketplace(
  brandId?: string,
  options?: { province?: string; quintile?: number; q?: string }
): Promise<BrandSchoolMarketplace> {
  const partnerIds = new Set<string>();
  if (brandId) {
    const rows = await prisma.submission.findMany({
      where: { campaign: { brandId }, state: "VALID" },
      select: { schoolId: true },
      distinct: ["schoolId"]
    });
    for (const row of rows) partnerIds.add(row.schoolId);
  }

  const publicSchools = await listPublicSchools({
    province: options?.province,
    quintile: options?.quintile,
    q: options?.q,
    limit: 48
  });

  const schoolCodes = publicSchools.map((s) => s.schoolCode);
  const dbSchools =
    schoolCodes.length > 0
      ? await prisma.school.findMany({
          where: { schoolCode: { in: schoolCodes } },
          select: {
            id: true,
            schoolCode: true,
            submittedNeeds: {
              where: { status: { in: ["APPROVED", "FUNDED", "UNDER_REVIEW"] } },
              orderBy: { estimatedCostZar: "desc" },
              take: 5
            }
          }
        })
      : [];

  const needsByCode = new Map(dbSchools.map((s) => [s.schoolCode, s]));

  const schools: BrandMarketplaceSchool[] = publicSchools.map((school) => {
    const db = needsByCode.get(school.schoolCode);
    const topNeed = db?.submittedNeeds[0];
    const needs = (db?.submittedNeeds ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      category: `${n.category} · ${n.subcategory}`,
      urgency: n.urgency,
      estimatedCostZar: n.estimatedCostZar,
      progressPercent: n.progressPercent,
      sponsorStatus: n.sponsorStatus,
      source: "submitted"
    }));

    const priorityTitle = topNeed?.title ?? school.priorityNeedTitle ?? "Infrastructure opportunity";
    const priorityCost = topNeed?.estimatedCostZar ?? school.priorityNeedCostZar ?? 0;
    const category = topNeed?.category ?? "Infrastructure";

    return {
      id: db?.id ?? school.schoolCode,
      schoolCode: school.schoolCode,
      name: school.name,
      province: school.province,
      district: school.district,
      learnerCount: school.learnerCount,
      priorityNeed: priorityTitle,
      estimatedCostZar: priorityCost,
      progressPercent: topNeed?.progressPercent ?? 0,
      verificationStatus: school.verificationApproved ? "APPROVED" : school.profileCompletionPercent >= 50 ? "VERIFIED" : "PENDING",
      imageCategory: schoolMarketplaceImageCategory(category),
      profileUrl: school.profileUrl,
      quintile: school.quintile,
      verifiedSubmissions: school.verifiedSubmissions,
      nationalRank: school.nationalRank,
      openNeedsCount: school.openNeedsCount,
      featuredBadges: school.featuredBadges,
      partnerSchool: db ? partnerIds.has(db.id) : false,
      needs
    };
  });

  schools.sort((a, b) => {
    if (a.partnerSchool !== b.partnerSchool) return a.partnerSchool ? -1 : 1;
    return b.verifiedSubmissions - a.verifiedSubmissions;
  });

  return {
    summary: {
      totalSchools: schools.length,
      withOpenNeeds: schools.filter((s) => s.openNeedsCount > 0).length,
      partnerSchools: schools.filter((s) => s.partnerSchool).length
    },
    schools
  };
}
