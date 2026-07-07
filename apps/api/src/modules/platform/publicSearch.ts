import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { brandLogoWebPath, hasBrandLogo } from "../../lib/brandLogo.js";
import { publicSchoolProfilePath } from "./publicSchools.js";

const REGISTERED_SCHOOL_STATUSES = ["PENDING", "VERIFIED", "APPROVED", "ACTIVE"] as const;

const publicBrandWhere = {
  status: "ACTIVE" as const,
  OR: [{ publicProfileEnabled: true }, { featuredOnHome: true }]
};

const ORG_LABEL: Record<string, string> = {
  SCHOOL: "School",
  NGO_NPO: "NGO / NPO",
  COMMUNITY: "Community organisation",
  FAITH: "Faith organisation"
};

function schoolStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Pending review";
    case "VERIFIED":
      return "Verified";
    case "APPROVED":
      return "Approved";
    case "ACTIVE":
      return "Active participant";
    default:
      return status;
  }
}

export const publicSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(80),
  type: z.enum(["all", "school", "brand"]).optional().default("all"),
  limit: z.coerce.number().int().min(1).max(25).optional().default(15)
});

export type PublicSchoolSearchHit = {
  type: "school";
  name: string;
  schoolCode: string;
  province: string;
  district: string;
  address: string;
  organizationCategory: string;
  organizationLabel: string;
  status: string;
  statusLabel: string;
  profileUrl: string;
  registered: true;
};

export type PublicBrandSearchHit = {
  type: "brand";
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  profileUrl: string;
};

export async function searchPlatformPublic(options: {
  q: string;
  type?: "all" | "school" | "brand";
  limit?: number;
}): Promise<{ query: string; schools: PublicSchoolSearchHit[]; brands: PublicBrandSearchHit[] }> {
  const type = options.type ?? "all";
  const limit = options.limit ?? 15;
  const q = options.q.trim();
  const perType = type === "all" ? Math.ceil(limit / 2) : limit;

  const textFilter = {
    OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { district: { contains: q, mode: "insensitive" as const } },
      { province: { contains: q, mode: "insensitive" as const } }
    ]
  };

  const [schoolRows, brandRows] = await Promise.all([
    type === "brand"
      ? Promise.resolve([])
      : prisma.school.findMany({
          where: {
            status: { in: [...REGISTERED_SCHOOL_STATUSES] },
            ...textFilter
          },
          select: {
            name: true,
            schoolCode: true,
            province: true,
            district: true,
            status: true,
            organizationCategory: true
          },
          orderBy: [{ status: "desc" }, { name: "asc" }],
          take: perType
        }),
    type === "school"
      ? Promise.resolve([])
      : prisma.brand.findMany({
          where: {
            ...publicBrandWhere,
            name: { contains: q, mode: "insensitive" }
          },
          select: {
            slug: true,
            name: true,
            logoUrl: true,
            description: true
          },
          orderBy: [{ featuredOnHome: "desc" }, { name: "asc" }],
          take: perType
        })
  ]);

  const schools: PublicSchoolSearchHit[] = schoolRows.map((row) => ({
    type: "school",
    name: row.name,
    schoolCode: row.schoolCode,
    province: row.province,
    district: row.district,
    address: `${row.district}, ${row.province}`,
    organizationCategory: row.organizationCategory,
    organizationLabel: ORG_LABEL[row.organizationCategory] ?? row.organizationCategory,
    status: row.status,
    statusLabel: schoolStatusLabel(row.status),
    profileUrl: publicSchoolProfilePath(row.schoolCode),
    registered: true
  }));

  const brands: PublicBrandSearchHit[] = brandRows.map((row) => ({
    type: "brand",
    name: row.name,
    slug: row.slug,
    logoUrl: hasBrandLogo(row.logoUrl) ? brandLogoWebPath(row.slug) : null,
    description: row.description,
    profileUrl: `/brand/${row.slug}`
  }));

  return { query: q, schools, brands };
}
