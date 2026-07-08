import { z } from "zod";
import type { Prisma } from "../../generated/prisma/index.js";
import { hasSchoolLogo, schoolLogoWebPath } from "../../lib/schoolLogo.js";
import { provinceNameFromCode, SA_PROVINCES, normalizeProvinceCode } from "../analytics/provinces.js";
import { listCanonicalDistrictsForProvince } from "../../lib/saDistricts.js";

const provinceNameSchema = z
  .string()
  .min(2)
  .refine(
    (value) => SA_PROVINCES.some((p) => p.name.toLowerCase() === value.trim().toLowerCase()),
    "Select a valid South African province."
  );

export const publicProfilePatchSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  province: provinceNameSchema.optional(),
  district: z.string().min(2).max(120).optional(),
  principalName: z.string().min(2).optional(),
  contactEmail: z.string().email().nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
  publicPhone: z.string().min(8).nullable().optional(),
  quintile: z.coerce.number().int().min(1).max(5).nullable().optional(),
  teacherCount: z.coerce.number().int().min(1).nullable().optional(),
  gpsLat: z.coerce.number().min(-90).max(90).nullable().optional(),
  gpsLng: z.coerce.number().min(-180).max(180).nullable().optional(),
  mission: z.string().max(2000).optional(),
  vision: z.string().max(2000).optional(),
  history: z.string().max(4000).optional(),
  schoolColours: z.array(z.string().max(32)).max(4).optional(),
  socialMedia: z
    .object({
      facebook: z.string().url().optional(),
      instagram: z.string().url().optional(),
      twitter: z.string().url().optional(),
      linkedin: z.string().url().optional()
    })
    .optional(),
  achievements: z.array(z.string().max(200)).max(12).optional(),
  impactStories: z
    .array(
      z.object({
        title: z.string().min(2).max(120),
        excerpt: z.string().min(10).max(500),
        year: z.coerce.number().int().min(1990).max(2100).optional()
      })
    )
    .max(6)
    .optional()
});

export type SchoolPublicProfileJson = {
  mission?: string;
  vision?: string;
  history?: string;
  schoolColours?: string[];
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  achievements?: string[];
  impactStories?: Array<{ title: string; excerpt: string; year?: number }>;
};

export type SchoolPublicProfilePayload = {
  logoUrl: string | null;
  websiteUrl: string | null;
  publicPhone: string | null;
  quintile: number | null;
  teacherCount: number | null;
  gpsLat: number | null;
  gpsLng: number | null;
  mission: string;
  vision: string;
  history: string;
  schoolColours: string[];
  socialMedia: SchoolPublicProfileJson["socialMedia"];
  achievements: string[];
  impactStories: NonNullable<SchoolPublicProfileJson["impactStories"]>;
  completionPercent: number;
  completionItems: Array<{ key: string; label: string; complete: boolean }>;
};

type SchoolProfileRow = {
  logoUrl: string | null;
  websiteUrl: string | null;
  publicPhone: string | null;
  quintile: number | null;
  teacherCount: number | null;
  gpsLat: number | null;
  gpsLng: number | null;
  publicProfile: Prisma.JsonValue;
  schoolCode: string;
  principalName: string;
  contactEmail: string | null;
  province: string;
  district: string;
};

function parsePublicProfileJson(value: Prisma.JsonValue): SchoolPublicProfileJson {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as SchoolPublicProfileJson;
}

export function buildSchoolPublicProfile(row: SchoolProfileRow): SchoolPublicProfilePayload {
  const json = parsePublicProfileJson(row.publicProfile);
  const completionItems = [
    { key: "logo", label: "School logo", complete: hasSchoolLogo(row.logoUrl) },
    { key: "gps", label: "GPS coordinates", complete: row.gpsLat != null && row.gpsLng != null },
    { key: "website", label: "Website", complete: Boolean(row.websiteUrl?.trim()) },
    { key: "quintile", label: "Quintile", complete: row.quintile != null },
    { key: "teachers", label: "Teacher count", complete: row.teacherCount != null },
    { key: "colours", label: "School colours", complete: (json.schoolColours?.length ?? 0) > 0 },
    { key: "social", label: "Social media", complete: Object.values(json.socialMedia ?? {}).some(Boolean) },
    { key: "mission", label: "Mission", complete: Boolean(json.mission?.trim()) },
    { key: "vision", label: "Vision", complete: Boolean(json.vision?.trim()) },
    { key: "history", label: "History", complete: Boolean(json.history?.trim()) },
    { key: "achievements", label: "Achievements", complete: (json.achievements?.length ?? 0) > 0 }
  ];
  const completeCount = completionItems.filter((i) => i.complete).length;
  const completionPercent = Math.round((completeCount / completionItems.length) * 100);

  return {
    logoUrl: hasSchoolLogo(row.logoUrl) ? schoolLogoWebPath(row.schoolCode) : null,
    websiteUrl: row.websiteUrl,
    publicPhone: row.publicPhone,
    quintile: row.quintile,
    teacherCount: row.teacherCount,
    gpsLat: row.gpsLat,
    gpsLng: row.gpsLng,
    mission: json.mission ?? "",
    vision: json.vision ?? "",
    history: json.history ?? "",
    schoolColours: json.schoolColours ?? [],
    socialMedia: json.socialMedia ?? {},
    achievements: json.achievements ?? [],
    impactStories: json.impactStories ?? [],
    completionPercent,
    completionItems
  };
}

export function mergePublicProfilePatch(
  existing: Prisma.JsonValue,
  patch: z.infer<typeof publicProfilePatchSchema>
): SchoolPublicProfileJson {
  const current = parsePublicProfileJson(existing);
  const next: SchoolPublicProfileJson = { ...current };

  if (patch.mission !== undefined) next.mission = patch.mission;
  if (patch.vision !== undefined) next.vision = patch.vision;
  if (patch.history !== undefined) next.history = patch.history;
  if (patch.schoolColours !== undefined) next.schoolColours = patch.schoolColours;
  if (patch.socialMedia !== undefined) next.socialMedia = { ...current.socialMedia, ...patch.socialMedia };
  if (patch.achievements !== undefined) next.achievements = patch.achievements;
  if (patch.impactStories !== undefined) next.impactStories = patch.impactStories;

  return next;
}

export function canonicalProvinceName(raw: string): string {
  const code = normalizeProvinceCode(raw);
  return provinceNameFromCode(code);
}

export function validateDistrictForProvince(
  province: string,
  district: string,
  existingDistrict?: string | null
): string | null {
  const trimmed = district.trim();
  if (trimmed.length < 2) return "District must be at least 2 characters.";
  if (existingDistrict && trimmed.toLowerCase() === existingDistrict.trim().toLowerCase()) {
    return null;
  }
  const allowed = listCanonicalDistrictsForProvince(province);
  if (allowed.length === 0) return null;
  const match = allowed.find((d) => d.toLowerCase() === trimmed.toLowerCase());
  return match ? null : "Select a valid district for the chosen province.";
}
