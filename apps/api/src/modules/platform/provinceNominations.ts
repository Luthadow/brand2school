import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { normalizeProvinceCode, provinceNameFromCode, SA_PROVINCES } from "../analytics/provinces.js";

export const createProvinceNominationSchema = z.object({
  provinceCode: z.string().min(2),
  schoolName: z.string().min(2).optional(),
  district: z.string().min(2).optional(),
  contactName: z.string().min(2).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(8).optional(),
  campaignSlug: z.string().min(2).optional(),
  message: z.string().min(10).max(2000).optional(),
  source: z.string().min(2).max(40).optional()
});

export type ProvinceNominationRow = {
  id: string;
  provinceCode: string;
  provinceName: string;
  schoolName: string | null;
  district: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  campaignSlug: string | null;
  message: string | null;
  source: string;
  status: string;
  createdAt: string;
};

export async function createProvinceNomination(
  input: z.infer<typeof createProvinceNominationSchema>
): Promise<ProvinceNominationRow> {
  const provinceCode = normalizeProvinceCode(input.provinceCode);
  const provinceName = provinceNameFromCode(provinceCode);

  const row = await prisma.provinceNomination.create({
    data: {
      provinceCode,
      provinceName,
      schoolName: input.schoolName?.trim() || null,
      district: input.district?.trim() || null,
      contactName: input.contactName?.trim() || null,
      contactEmail: input.contactEmail?.trim().toLowerCase() || null,
      contactPhone: input.contactPhone?.trim() || null,
      campaignSlug: input.campaignSlug?.trim().toLowerCase() || null,
      message: input.message?.trim() || null,
      source: input.source ?? "web"
    }
  });

  return mapNomination(row);
}

export async function listProvinceNominations(options?: {
  status?: string;
  provinceCode?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ total: number; page: number; pageSize: number; items: ProvinceNominationRow[] }> {
  const page = options?.page ?? 1;
  const pageSize = Math.min(options?.pageSize ?? 25, 100);
  const where = {
    ...(options?.status ? { status: options.status } : {}),
    ...(options?.provinceCode ? { provinceCode: normalizeProvinceCode(options.provinceCode) } : {})
  };

  const [total, rows] = await Promise.all([
    prisma.provinceNomination.count({ where }),
    prisma.provinceNomination.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);

  return { total, page, pageSize, items: rows.map(mapNomination) };
}

export function listProvinceNominationOptions(): Array<{ code: string; name: string }> {
  return SA_PROVINCES.map((p) => ({ code: p.code, name: p.name }));
}

function mapNomination(row: {
  id: string;
  provinceCode: string;
  provinceName: string;
  schoolName: string | null;
  district: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  campaignSlug: string | null;
  message: string | null;
  source: string;
  status: string;
  createdAt: Date;
}): ProvinceNominationRow {
  return {
    id: row.id,
    provinceCode: row.provinceCode,
    provinceName: row.provinceName,
    schoolName: row.schoolName,
    district: row.district,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    campaignSlug: row.campaignSlug,
    message: row.message,
    source: row.source,
    status: row.status,
    createdAt: row.createdAt.toISOString()
  };
}
