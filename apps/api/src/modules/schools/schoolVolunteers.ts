import type { SchoolVolunteerStatus } from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";

export type SchoolVolunteerItem = {
  id: string;
  fullName: string;
  role: string;
  phone: string | null;
  email: string | null;
  skills: string | null;
  hoursLogged: number;
  status: SchoolVolunteerStatus;
  notes: string | null;
  eventsAssigned: number;
  createdAt: string;
};

export function serializeVolunteer(
  row: Awaited<ReturnType<typeof listSchoolVolunteers>>[number]
): SchoolVolunteerItem {
  return {
    id: row.id,
    fullName: row.fullName,
    role: row.role,
    phone: row.phone,
    email: row.email,
    skills: row.skills,
    hoursLogged: row.hoursLogged,
    status: row.status,
    notes: row.notes,
    eventsAssigned: row._count.assignments,
    createdAt: row.createdAt.toISOString()
  };
}

export async function listSchoolVolunteers(schoolId: string) {
  return prisma.schoolVolunteer.findMany({
    where: { schoolId, status: { not: "INACTIVE" } },
    include: { _count: { select: { assignments: true } } },
    orderBy: [{ status: "asc" }, { fullName: "asc" }]
  });
}

export async function createSchoolVolunteer(
  schoolId: string,
  data: {
    fullName: string;
    role: string;
    phone?: string | null;
    email?: string | null;
    skills?: string | null;
    hoursLogged?: number;
    notes?: string | null;
  }
) {
  return prisma.schoolVolunteer.create({
    data: {
      schoolId,
      fullName: data.fullName,
      role: data.role,
      phone: data.phone ?? null,
      email: data.email ?? null,
      skills: data.skills ?? null,
      hoursLogged: data.hoursLogged ?? 0,
      notes: data.notes ?? null,
      status: "ACTIVE"
    }
  });
}

export async function updateSchoolVolunteer(
  schoolId: string,
  volunteerId: string,
  data: Partial<{
    fullName: string;
    role: string;
    phone: string | null;
    email: string | null;
    skills: string | null;
    hoursLogged: number;
    status: SchoolVolunteerStatus;
    notes: string | null;
  }>
) {
  const existing = await prisma.schoolVolunteer.findFirst({
    where: { id: volunteerId, schoolId }
  });
  if (!existing) return null;
  return prisma.schoolVolunteer.update({
    where: { id: volunteerId },
    data
  });
}
