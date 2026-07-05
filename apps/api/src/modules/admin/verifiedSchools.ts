import { prisma } from "../../lib/prisma.js";

export const AWAITING_SCHOOL_STATUSES = ["PENDING"] as const;
export const VERIFIED_SCHOOL_STATUSES = ["VERIFIED", "APPROVED", "ACTIVE"] as const;

export function formatSchoolAddress(school: { district: string; province: string }): string {
  return `${school.district}, ${school.province}`;
}

export function resolveSchoolEmail(school: {
  contactEmail: string | null;
  adminUser?: { email: string } | null;
}): string {
  return school.contactEmail ?? school.adminUser?.email ?? "—";
}

const verifiedSchoolSelect = {
  id: true,
  name: true,
  province: true,
  district: true,
  principalName: true,
  contactEmail: true,
  status: true,
  organizationCategory: true,
  updatedAt: true,
  adminUser: { select: { email: true } }
} as const;

export type VerifiedSchoolRow = Awaited<ReturnType<typeof listVerifiedSchools>>["items"][number];

export async function listVerifiedSchools(options: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<{
  items: Array<{
    id: string;
    name: string;
    province: string;
    district: string;
    principalName: string;
    contactEmail: string | null;
    status: string;
    organizationCategory: string;
    updatedAt: Date;
    adminUser: { email: string } | null;
    address: string;
    email: string;
  }>;
  pageMeta: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 25;
  const skip = (page - 1) * pageSize;
  const search = options.search?.trim();

  const where = {
    status: { in: [...VERIFIED_SCHOOL_STATUSES] },
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { district: { contains: search, mode: "insensitive" as const } },
            { province: { contains: search, mode: "insensitive" as const } },
            { principalName: { contains: search, mode: "insensitive" as const } },
            { contactEmail: { contains: search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };

  const [total, rows] = await Promise.all([
    prisma.school.count({ where }),
    prisma.school.findMany({
      where,
      select: verifiedSchoolSelect,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      skip,
      take: pageSize
    })
  ]);

  const items = rows.map((row) => ({
    ...row,
    address: formatSchoolAddress(row),
    email: resolveSchoolEmail(row)
  }));

  return {
    items,
    pageMeta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  };
}

export async function fetchAllVerifiedSchoolsForReport(): Promise<
  Array<{
    name: string;
    address: string;
    principalName: string;
    email: string;
    status: string;
  }>
> {
  const rows = await prisma.school.findMany({
    where: { status: { in: [...VERIFIED_SCHOOL_STATUSES] } },
    select: verifiedSchoolSelect,
    orderBy: [{ name: "asc" }]
  });

  return rows.map((row) => ({
    name: row.name,
    address: formatSchoolAddress(row),
    principalName: row.principalName,
    email: resolveSchoolEmail(row),
    status: row.status
  }));
}
