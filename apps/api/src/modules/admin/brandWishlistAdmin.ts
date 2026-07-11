import { prisma } from "../../lib/prisma.js";
import {
  BRAND_WISHLIST_CATEGORIES,
  type BrandWishlistNominationRow
} from "../platform/brandWishlist.js";

export type BrandWishlistAdminSummary = {
  generatedAt: string;
  totalNominations: number;
  nominationsWithComments: number;
  brands: Array<{
    brandId: string;
    brandName: string;
    categoryId: string;
    categoryLabel: string;
    nominations: number;
    commentsCount: number;
  }>;
};

export type BrandWishlistBrandReportData = {
  generatedAt: string;
  brandId: string;
  brandName: string;
  categoryLabel: string;
  totalNominations: number;
  commentsCount: number;
  provinceBreakdown: Array<{ provinceName: string; count: number }>;
  nominations: BrandWishlistNominationRow[];
  disclaimer: string;
};

function mapRow(row: {
  id: string;
  categoryId: string;
  categoryLabel: string;
  brandId: string;
  brandName: string;
  provinceCode: string;
  provinceName: string;
  contactName: string | null;
  schoolName: string | null;
  reason: string | null;
  source: string;
  createdAt: Date;
}): BrandWishlistNominationRow {
  return {
    id: row.id,
    categoryId: row.categoryId,
    categoryLabel: row.categoryLabel,
    brandId: row.brandId,
    brandName: row.brandName,
    provinceCode: row.provinceCode,
    provinceName: row.provinceName,
    contactName: row.contactName,
    schoolName: row.schoolName,
    reason: row.reason,
    source: row.source,
    createdAt: row.createdAt.toISOString()
  };
}

export async function getBrandWishlistAdminSummary(): Promise<BrandWishlistAdminSummary> {
  const [totalNominations, nominationsWithComments, brandCounts, commentCounts] = await Promise.all([
    prisma.brandWishlistNomination.count(),
    prisma.brandWishlistNomination.count({ where: { reason: { not: null } } }),
    prisma.brandWishlistNomination.groupBy({
      by: ["brandId", "brandName", "categoryId", "categoryLabel"],
      _count: { _all: true }
    }),
    prisma.brandWishlistNomination.groupBy({
      by: ["brandId"],
      where: { reason: { not: null } },
      _count: { _all: true }
    })
  ]);

  const countByBrand = new Map(brandCounts.map((r) => [r.brandId, r._count._all]));
  const commentsByBrand = new Map(commentCounts.map((r) => [r.brandId, r._count._all]));

  const brands = BRAND_WISHLIST_CATEGORIES.flatMap((category) =>
    category.brands.map((brand) => ({
      brandId: brand.id,
      brandName: brand.name,
      categoryId: category.id,
      categoryLabel: category.label,
      nominations: countByBrand.get(brand.id) ?? 0,
      commentsCount: commentsByBrand.get(brand.id) ?? 0
    }))
  ).sort((a, b) => b.nominations - a.nominations || a.brandName.localeCompare(b.brandName));

  return {
    generatedAt: new Date().toISOString(),
    totalNominations,
    nominationsWithComments,
    brands
  };
}

export async function listBrandWishlistNominationsForAdmin(options?: {
  brandId?: string;
  commentsOnly?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<{ total: number; page: number; pageSize: number; items: BrandWishlistNominationRow[] }> {
  const page = options?.page ?? 1;
  const pageSize = Math.min(options?.pageSize ?? 25, 100);
  const where = {
    ...(options?.brandId ? { brandId: options.brandId } : {}),
    ...(options?.commentsOnly ? { reason: { not: null } } : {})
  };

  const [total, rows] = await Promise.all([
    prisma.brandWishlistNomination.count({ where }),
    prisma.brandWishlistNomination.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);

  return { total, page, pageSize, items: rows.map(mapRow) };
}

export async function getBrandWishlistBrandReportData(
  brandId: string
): Promise<BrandWishlistBrandReportData | null> {
  const brandMeta = BRAND_WISHLIST_CATEGORIES.flatMap((c) =>
    c.brands.map((b) => ({ ...b, categoryLabel: c.label }))
  ).find((b) => b.id === brandId);

  if (!brandMeta) return null;

  const rows = await prisma.brandWishlistNomination.findMany({
    where: { brandId },
    orderBy: { createdAt: "desc" }
  });

  const provinceMap = new Map<string, number>();
  for (const row of rows) {
    provinceMap.set(row.provinceName, (provinceMap.get(row.provinceName) ?? 0) + 1);
  }

  const provinceBreakdown = [...provinceMap.entries()]
    .map(([provinceName, count]) => ({ provinceName, count }))
    .sort((a, b) => b.count - a.count);

  const nominations = rows.map(mapRow);
  const commentsCount = nominations.filter((n) => n.reason?.trim()).length;

  return {
    generatedAt: new Date().toISOString(),
    brandId: brandMeta.id,
    brandName: brandMeta.name,
    categoryLabel: brandMeta.categoryLabel,
    totalNominations: nominations.length,
    commentsCount,
    provinceBreakdown,
    nominations,
    disclaimer:
      "Community nominations do not imply affiliation with or endorsement by the nominated company. For Brand2School internal outreach planning only."
  };
}

export function listAllWishlistBrandIds(): string[] {
  return BRAND_WISHLIST_CATEGORIES.flatMap((c) => c.brands.map((b) => b.id));
}
