import type { SchoolAlumniRole, SchoolAlumniStatus } from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";

export const ALUMNI_ROLE_LABELS: Record<SchoolAlumniRole, string> = {
  ALUMNI: "Past learner",
  BUSINESS_OWNER: "Business owner",
  PROFESSIONAL: "Professional",
  SPONSOR: "Sponsor",
  MENTOR: "Mentor",
  DONOR: "Donor",
  EMPLOYER: "Employer"
};

export type SchoolAlumniItem = {
  id: string;
  fullName: string;
  graduationYear: number | null;
  profession: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  linkedInUrl: string | null;
  role: SchoolAlumniRole;
  roleLabel: string;
  offering: string | null;
  status: SchoolAlumniStatus;
  createdAt: string;
};

export function serializeAlumni(row: Awaited<ReturnType<typeof listSchoolAlumni>>[number]): SchoolAlumniItem {
  return {
    id: row.id,
    fullName: row.fullName,
    graduationYear: row.graduationYear,
    profession: row.profession,
    company: row.company,
    email: row.email,
    phone: row.phone,
    linkedInUrl: row.linkedInUrl,
    role: row.role,
    roleLabel: ALUMNI_ROLE_LABELS[row.role],
    offering: row.offering,
    status: row.status,
    createdAt: row.createdAt.toISOString()
  };
}

export async function listSchoolAlumni(schoolId: string) {
  return prisma.schoolAlumni.findMany({
    where: { schoolId, status: { not: "INACTIVE" } },
    orderBy: [{ role: "asc" }, { fullName: "asc" }]
  });
}

export async function createSchoolAlumni(
  schoolId: string,
  data: {
    fullName: string;
    graduationYear?: number | null;
    profession?: string | null;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    linkedInUrl?: string | null;
    role?: SchoolAlumniRole;
    offering?: string | null;
  }
) {
  return prisma.schoolAlumni.create({
    data: {
      schoolId,
      fullName: data.fullName,
      graduationYear: data.graduationYear ?? null,
      profession: data.profession ?? null,
      company: data.company ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      linkedInUrl: data.linkedInUrl ?? null,
      role: data.role ?? "ALUMNI",
      offering: data.offering ?? null,
      status: "ACTIVE"
    }
  });
}

export async function updateSchoolAlumni(
  schoolId: string,
  alumniId: string,
  data: Partial<{
    fullName: string;
    graduationYear: number | null;
    profession: string | null;
    company: string | null;
    email: string | null;
    phone: string | null;
    linkedInUrl: string | null;
    role: SchoolAlumniRole;
    offering: string | null;
    status: SchoolAlumniStatus;
  }>
) {
  const existing = await prisma.schoolAlumni.findFirst({
    where: { id: alumniId, schoolId }
  });
  if (!existing) return null;
  return prisma.schoolAlumni.update({
    where: { id: alumniId },
    data
  });
}

export async function listPublicAlumniHighlights(schoolId: string, limit = 6) {
  const rows = await prisma.schoolAlumni.findMany({
    where: { schoolId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: limit
  });
  return rows.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    roleLabel: ALUMNI_ROLE_LABELS[row.role],
    profession: row.profession,
    company: row.company,
    graduationYear: row.graduationYear
  }));
}
