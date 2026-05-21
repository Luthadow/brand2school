import { prisma } from "../../lib/prisma.js";
import { getSchoolRankings, type SchoolRankingRow } from "../schools/schoolParticipation.js";
import { resolveLogoPublicUrl } from "../../lib/brandStorage.js";

export type BrandPartnerRanking = {
  rank: number;
  brandSlug: string;
  brandName: string;
  logoUrl: string | null;
  validSubmissions: number;
  schoolsReached: number;
  activeCampaigns: number;
};

export type PlatformRankingsPayload = {
  updatedAt: string;
  schools: SchoolRankingRow[];
  brandPartners: BrandPartnerRanking[];
};

export async function getPlatformRankings(schoolLimit = 10, brandLimit = 12): Promise<PlatformRankingsPayload> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const schools = await getSchoolRankings(schoolLimit);

  const activeBrands = await prisma.brand.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ publicProfileEnabled: true }, { featuredOnHome: true }]
    },
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      campaigns: {
        where: { isActive: true },
        select: {
          id: true,
          submissions: {
            where: { state: "VALID", createdAt: { gte: startOfMonth } },
            select: { schoolId: true }
          }
        }
      }
    }
  });

  const brandPartners: BrandPartnerRanking[] = activeBrands
    .map((brand) => {
      const validSubmissions = brand.campaigns.reduce((sum, c) => sum + c.submissions.length, 0);
      const schoolsReached = new Set(brand.campaigns.flatMap((c) => c.submissions.map((s) => s.schoolId))).size;
      return {
        brandSlug: brand.slug,
        brandName: brand.name,
        logoUrl: resolveLogoPublicUrl(brand.logoUrl),
        validSubmissions,
        schoolsReached,
        activeCampaigns: brand.campaigns.length,
        rank: 0
      };
    })
    .filter((b) => b.validSubmissions > 0 || b.activeCampaigns > 0)
    .sort((a, b) => b.validSubmissions - a.validSubmissions)
    .slice(0, brandLimit)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  return {
    updatedAt: new Date().toISOString(),
    schools,
    brandPartners
  };
}
