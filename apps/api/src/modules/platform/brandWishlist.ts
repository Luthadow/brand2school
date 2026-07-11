import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { registeredSchoolWhere } from "../../lib/schoolMetrics.js";
import { normalizeProvinceCode, provinceNameFromCode, SA_PROVINCES } from "../analytics/provinces.js";

export type BrandWishlistBrand = {
  id: string;
  name: string;
};

export type BrandWishlistCategory = {
  id: string;
  label: string;
  icon: string;
  brands: BrandWishlistBrand[];
};

/** Curated brands for community wishlist — not an endorsement or partnership claim. */
export const BRAND_WISHLIST_CATEGORIES: BrandWishlistCategory[] = [
  {
    id: "supermarkets",
    label: "Supermarkets",
    icon: "🛒",
    brands: [
      { id: "pick-n-pay", name: "Pick n Pay" },
      { id: "shoprite", name: "Shoprite" },
      { id: "checkers", name: "Checkers" },
      { id: "spar", name: "Spar" },
      { id: "boxer", name: "Boxer" }
    ]
  },
  {
    id: "food-fmcg",
    label: "Food & FMCG",
    icon: "🍞",
    brands: [
      { id: "tiger-brands", name: "Tiger Brands" },
      { id: "premier-fmcg", name: "Premier FMCG" },
      { id: "clover", name: "Clover" },
      { id: "rcl-foods", name: "RCL FOODS" }
    ]
  },
  {
    id: "fuel",
    label: "Fuel",
    icon: "⛽",
    brands: [
      { id: "engen", name: "Engen" },
      { id: "bp", name: "BP" },
      { id: "shell", name: "Shell" },
      { id: "sasol", name: "Sasol" }
    ]
  },
  {
    id: "banking",
    label: "Banking",
    icon: "🏦",
    brands: [
      { id: "capitec", name: "Capitec" },
      { id: "standard-bank", name: "Standard Bank" },
      { id: "fnb", name: "FNB" },
      { id: "nedbank", name: "Nedbank" },
      { id: "absa", name: "Absa" }
    ]
  },
  {
    id: "automotive",
    label: "Automotive",
    icon: "🚗",
    brands: [
      { id: "toyota", name: "Toyota" },
      { id: "volkswagen", name: "Volkswagen" },
      { id: "ford", name: "Ford" },
      { id: "motus", name: "Motus" }
    ]
  }
];

const brandLookup = new Map<string, { brand: BrandWishlistBrand; category: BrandWishlistCategory }>();
for (const category of BRAND_WISHLIST_CATEGORIES) {
  for (const brand of category.brands) {
    brandLookup.set(brand.id, { brand, category });
  }
}

export const createBrandWishlistNominationSchema = z.object({
  brandId: z.string().min(2).max(64),
  provinceCode: z.string().min(2),
  contactName: z.string().min(2).max(120).optional(),
  schoolName: z.string().min(2).max(200).optional(),
  reason: z.string().min(10).max(2000).optional(),
  source: z.string().min(2).max(40).optional()
});

export type BrandWishlistNominationRow = {
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
  createdAt: string;
};

export type BrandWishlistPublicResults = {
  generatedAt: string;
  totalNominations: number;
  schoolsRegistered: number;
  provincesRepresented: number;
  topBrands: Array<{ rank: number; brandId: string; brandName: string; nominations: number }>;
  categories: BrandWishlistCategory[];
  disclaimer: string;
};

export function listBrandWishlistCategories(): BrandWishlistCategory[] {
  return BRAND_WISHLIST_CATEGORIES;
}

export async function createBrandWishlistNomination(
  input: z.infer<typeof createBrandWishlistNominationSchema>
): Promise<BrandWishlistNominationRow> {
  const match = brandLookup.get(input.brandId);
  if (!match) {
    throw new Error("INVALID_BRAND");
  }

  const provinceCode = normalizeProvinceCode(input.provinceCode);
  const provinceName = provinceNameFromCode(provinceCode);
  if (!SA_PROVINCES.some((p) => p.code === provinceCode)) {
    throw new Error("INVALID_PROVINCE");
  }

  const row = await prisma.brandWishlistNomination.create({
    data: {
      categoryId: match.category.id,
      categoryLabel: match.category.label,
      brandId: match.brand.id,
      brandName: match.brand.name,
      provinceCode,
      provinceName,
      contactName: input.contactName?.trim() || null,
      schoolName: input.schoolName?.trim() || null,
      reason: input.reason?.trim() || null,
      source: input.source ?? "web"
    }
  });

  return mapNomination(row);
}

export async function getBrandWishlistPublicResults(): Promise<BrandWishlistPublicResults> {
  const [totalNominations, schoolsRegistered, nominationProvinces, schoolProvinces, brandCounts] =
    await Promise.all([
      prisma.brandWishlistNomination.count(),
      prisma.school.count({ where: registeredSchoolWhere }),
      prisma.brandWishlistNomination.findMany({
        distinct: ["provinceCode"],
        select: { provinceCode: true }
      }),
      prisma.school.findMany({
        where: registeredSchoolWhere,
        distinct: ["province"],
        select: { province: true }
      }),
      prisma.brandWishlistNomination.groupBy({
        by: ["brandId", "brandName"],
        _count: { _all: true }
      })
    ]);

  const provinceCodes = new Set<string>();
  for (const row of nominationProvinces) {
    provinceCodes.add(normalizeProvinceCode(row.provinceCode));
  }
  for (const row of schoolProvinces) {
    provinceCodes.add(normalizeProvinceCode(row.province));
  }

  const sortedBrands = [...brandCounts].sort((a, b) => b._count._all - a._count._all).slice(0, 5);

  return {
    generatedAt: new Date().toISOString(),
    totalNominations,
    schoolsRegistered,
    provincesRepresented: Math.min(SA_PROVINCES.length, provinceCodes.size),
    topBrands: sortedBrands.map((row, index) => ({
      rank: index + 1,
      brandId: row.brandId,
      brandName: row.brandName,
      nominations: row._count._all
    })),
    categories: BRAND_WISHLIST_CATEGORIES,
    disclaimer:
      "A nomination does not imply that any company is currently affiliated with or has endorsed Brand2School."
  };
}

function mapNomination(row: {
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
