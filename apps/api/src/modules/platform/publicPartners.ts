import { prisma } from "../../lib/prisma.js";
import { brandLogoWebPath, hasBrandLogo } from "../../lib/brandLogo.js";
import { normalizeProvinceCode, provinceNameFromCode, SA_PROVINCES } from "../analytics/provinces.js";

const publicBrandWhere = {
  status: "ACTIVE" as const,
  OR: [{ publicProfileEnabled: true }, { featuredOnHome: true }]
};

const TRUSTED_VERIFICATION = new Set(["VERIFIED", "FOUNDER_VERIFIED"]);

function platformAssetPath(path: string): string {
  return `/api/v1/platform${path}`;
}

export type PlatformPartner = {
  slug: string;
  name: string;
  logoUrl: string;
  websiteUrl: string | null;
  brandColor: string | null;
  featured: boolean;
};

export type PublicPartnerSummary = {
  slug: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  brandColor: string | null;
  featuredOnHome: boolean;
  publicProfileEnabled: boolean;
  description: string | null;
  validSubmissions: number;
  schoolsReached: number;
  activeCampaigns: number;
};

export type PublicBrandProfile = PublicPartnerSummary & {
  verifiedPartner: boolean;
  verificationCode: string | null;
  verificationStatus: string | null;
  founderVerified: boolean;
  isTrusted: boolean;
  verifyUrl: string | null;
  brandProfileUrl: string;
  certificatePdfUrl: string | null;
  verifyQrImageUrl: string | null;
  brandQrImageUrl: string | null;
  provinces: Array<{ code: string; name: string; schools: number; submissions: number; intensity: number }>;
  campaigns: Array<{
    id: string;
    slug: string;
    name: string;
    category: string | null;
    infrastructureGoal: string | null;
    validSubmissions: number;
    targetSubmissions: number;
    schoolsParticipating: number;
    percentToTarget: number;
    isActive: boolean;
  }>;
  topSchools: Array<{ schoolName: string; province: string; submissions: number }>;
  partnerRank: number | null;
};

export async function getPlatformPartners(): Promise<PlatformPartner[]> {
  const brands = await prisma.brand.findMany({
    where: {
      status: "ACTIVE",
      featuredOnHome: true,
      logoUrl: { not: null }
    },
    select: {
      slug: true,
      name: true,
      logoUrl: true,
      websiteUrl: true,
      brandColor: true,
      featuredOnHome: true
    },
    orderBy: [{ homeSortOrder: "asc" }, { name: "asc" }]
  });

  return brands
    .map((b) => {
      if (!hasBrandLogo(b.logoUrl)) return null;
      return {
        slug: b.slug,
        name: b.name,
        logoUrl: brandLogoWebPath(b.slug),
        websiteUrl: b.websiteUrl,
        brandColor: b.brandColor,
        featured: b.featuredOnHome
      };
    })
    .filter((row): row is PlatformPartner => row !== null);
}

export async function listPublicPartners(): Promise<PublicPartnerSummary[]> {
  const brands = await prisma.brand.findMany({
    where: publicBrandWhere,
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      websiteUrl: true,
      brandColor: true,
      featuredOnHome: true,
      homeSortOrder: true,
      publicProfileEnabled: true,
      description: true,
      campaigns: {
        where: { isActive: true },
        select: {
          id: true,
          submissions: {
            where: { state: "VALID" },
            select: { schoolId: true }
          }
        }
      }
    },
    orderBy: [{ homeSortOrder: "asc" }, { featuredOnHome: "desc" }, { name: "asc" }]
  });

  const summaries: Array<PublicPartnerSummary & { homeSortOrder: number }> = [];

  for (const brand of brands) {
    const validSubmissions = brand.campaigns.reduce((sum, c) => sum + c.submissions.length, 0);
    const schoolsReached = new Set(
      brand.campaigns.flatMap((c) => c.submissions.map((s) => s.schoolId))
    ).size;

    summaries.push({
      slug: brand.slug,
      name: brand.name,
      logoUrl: hasBrandLogo(brand.logoUrl) ? brandLogoWebPath(brand.slug) : null,
      websiteUrl: brand.websiteUrl,
      brandColor: brand.brandColor,
      featuredOnHome: brand.featuredOnHome,
      publicProfileEnabled: brand.publicProfileEnabled,
      description: brand.description,
      validSubmissions,
      schoolsReached,
      activeCampaigns: brand.campaigns.length,
      homeSortOrder: brand.homeSortOrder
    });
  }

  return summaries
    .sort((a, b) => {
      if (a.homeSortOrder !== b.homeSortOrder) return a.homeSortOrder - b.homeSortOrder;
      if (b.validSubmissions !== a.validSubmissions) return b.validSubmissions - a.validSubmissions;
      return a.name.localeCompare(b.name);
    })
    .map(({ homeSortOrder: _homeSortOrder, ...row }) => row);
}

async function getPartnerRank(brandId: string): Promise<number | null> {
  const grouped = await prisma.submission.groupBy({
    by: ["campaignId"],
    where: { state: "VALID", campaign: { brandId } },
    _count: { _all: true }
  });
  const total = grouped.reduce((sum, g) => sum + g._count._all, 0);
  if (total === 0) return null;

  const allBrands = await prisma.submission.groupBy({
    by: ["campaignId"],
    where: { state: "VALID" },
    _count: { _all: true }
  });

  const campaignBrandMap = new Map(
    (
      await prisma.campaign.findMany({
        where: { id: { in: allBrands.map((b) => b.campaignId) } },
        select: { id: true, brandId: true }
      })
    ).map((c) => [c.id, c.brandId])
  );

  const brandTotals = new Map<string, number>();
  for (const row of allBrands) {
    const bid = campaignBrandMap.get(row.campaignId);
    if (!bid) continue;
    brandTotals.set(bid, (brandTotals.get(bid) ?? 0) + row._count._all);
  }

  const sorted = [...brandTotals.entries()].sort((a, b) => b[1] - a[1]);
  const rank = sorted.findIndex(([id]) => id === brandId);
  return rank >= 0 ? rank + 1 : null;
}

export async function getPublicBrandBySlug(slug: string): Promise<PublicBrandProfile | null> {
  const brand = await prisma.brand.findFirst({
    where: { slug, ...publicBrandWhere },
    include: {
      campaigns: {
        include: {
          submissions: {
            where: { state: "VALID" },
            select: {
              schoolId: true,
              school: { select: { name: true, province: true } }
            }
          }
        },
        orderBy: { startsAt: "desc" }
      }
    }
  });

  if (!brand) return null;

  const provinceMap = new Map<string, { schools: Set<string>; submissions: number }>();
  for (const p of SA_PROVINCES) {
    provinceMap.set(p.code, { schools: new Set(), submissions: 0 });
  }

  const schoolTotals = new Map<string, { name: string; province: string; submissions: number }>();

  for (const campaign of brand.campaigns) {
    for (const sub of campaign.submissions) {
      const code = normalizeProvinceCode(sub.school.province);
      const bucket = provinceMap.get(code) ?? { schools: new Set(), submissions: 0 };
      bucket.schools.add(sub.schoolId);
      bucket.submissions += 1;
      provinceMap.set(code, bucket);

      const existing = schoolTotals.get(sub.schoolId) ?? {
        name: sub.school.name,
        province: code,
        submissions: 0
      };
      existing.submissions += 1;
      schoolTotals.set(sub.schoolId, existing);
    }
  }

  const maxSubmissions = Math.max(...[...provinceMap.values()].map((v) => v.submissions), 1);
  const provinces = SA_PROVINCES.map((p) => {
    const stats = provinceMap.get(p.code) ?? { schools: new Set(), submissions: 0 };
    return {
      code: p.code,
      name: p.name,
      schools: stats.schools.size,
      submissions: stats.submissions,
      intensity: stats.submissions === 0 ? 0 : Math.round((stats.submissions / maxSubmissions) * 100)
    };
  }).filter((p) => p.submissions > 0);

  const campaigns = brand.campaigns.map((c) => {
    const validSubmissions = c.submissions.length;
    const schoolsParticipating = new Set(c.submissions.map((s) => s.schoolId)).size;
    const percentToTarget =
      c.targetSubmissions > 0 ? Math.min(100, Math.round((validSubmissions / c.targetSubmissions) * 100)) : 0;
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      category: c.category,
      infrastructureGoal: c.infrastructureGoal,
      validSubmissions,
      targetSubmissions: c.targetSubmissions,
      schoolsParticipating,
      percentToTarget,
      isActive: c.isActive
    };
  });

  const validSubmissions = campaigns.reduce((sum, c) => sum + c.validSubmissions, 0);
  const schoolsReached = new Set(brand.campaigns.flatMap((c) => c.submissions.map((s) => s.schoolId))).size;

  const topSchools = [...schoolTotals.values()]
    .sort((a, b) => b.submissions - a.submissions)
    .slice(0, 8)
    .map((s) => ({
      schoolName: s.name,
      province: provinceNameFromCode(s.province),
      submissions: s.submissions
    }));

  const partnerRank = await getPartnerRank(brand.id);

  const isTrusted = TRUSTED_VERIFICATION.has(brand.verificationStatus);
  const verificationCode = brand.verificationCode;
  const brandProfileUrl = `/brand/${brand.slug}`;

  return {
    slug: brand.slug,
    name: brand.name,
    logoUrl: hasBrandLogo(brand.logoUrl) ? brandLogoWebPath(brand.slug) : null,
    websiteUrl: brand.websiteUrl,
    brandColor: brand.brandColor,
    featuredOnHome: brand.featuredOnHome,
    publicProfileEnabled: brand.publicProfileEnabled,
    description: brand.description,
    validSubmissions,
    schoolsReached,
    activeCampaigns: campaigns.filter((c) => c.isActive).length,
    verifiedPartner: brand.status === "ACTIVE" && (brand.publicProfileEnabled || brand.featuredOnHome),
    verificationCode,
    verificationStatus: brand.verificationStatus,
    founderVerified: brand.verificationStatus === "FOUNDER_VERIFIED" || brand.founderExempt,
    isTrusted,
    verifyUrl: verificationCode ? `/verify/${verificationCode}` : null,
    brandProfileUrl,
    certificatePdfUrl:
      isTrusted && verificationCode
        ? platformAssetPath(`/verify/${encodeURIComponent(verificationCode)}/certificate`)
        : null,
    verifyQrImageUrl: verificationCode
      ? platformAssetPath(`/verify/${encodeURIComponent(verificationCode)}/qr`)
      : null,
    brandQrImageUrl: platformAssetPath(`/brands/${encodeURIComponent(brand.slug)}/qr`),
    provinces,
    campaigns,
    topSchools,
    partnerRank
  };
}
