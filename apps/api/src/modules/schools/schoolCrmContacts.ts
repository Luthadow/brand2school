import type { SchoolCrmContactType } from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";

export const CONTACT_TYPE_LABELS: Record<SchoolCrmContactType, string> = {
  BRAND: "Brand partner",
  PARENT: "Parent / guardian",
  SGB: "SGB member",
  DONOR: "Donor",
  SUPPORT: "Support contact",
  PARTNER: "Community partner",
  OTHER: "Other"
};

export type SchoolCrmContactItem = {
  id: string;
  fullName: string;
  organization: string | null;
  email: string | null;
  phone: string | null;
  contactType: SchoolCrmContactType;
  contactTypeLabel: string;
  notes: string | null;
  activityCount: number;
  openTaskCount: number;
  createdAt: string;
};

export function serializeCrmContact(
  row: Awaited<ReturnType<typeof listSchoolCrmContacts>>[number]
): SchoolCrmContactItem {
  return {
    id: row.id,
    fullName: row.fullName,
    organization: row.organization,
    email: row.email,
    phone: row.phone,
    contactType: row.contactType,
    contactTypeLabel: CONTACT_TYPE_LABELS[row.contactType],
    notes: row.notes,
    activityCount: row._count.activities,
    openTaskCount: row._count.tasks,
    createdAt: row.createdAt.toISOString()
  };
}

export async function listSchoolCrmContacts(schoolId: string) {
  return prisma.schoolCrmContact.findMany({
    where: { schoolId },
    include: {
      _count: {
        select: {
          activities: true,
          tasks: { where: { status: "OPEN" } }
        }
      }
    },
    orderBy: [{ contactType: "asc" }, { fullName: "asc" }]
  });
}

export async function createSchoolCrmContact(
  schoolId: string,
  data: {
    fullName: string;
    organization?: string | null;
    email?: string | null;
    phone?: string | null;
    contactType?: SchoolCrmContactType;
    notes?: string | null;
  }
) {
  return prisma.schoolCrmContact.create({
    data: {
      schoolId,
      fullName: data.fullName,
      organization: data.organization ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      contactType: data.contactType ?? "OTHER",
      notes: data.notes ?? null
    }
  });
}

export async function updateSchoolCrmContact(
  schoolId: string,
  contactId: string,
  data: Partial<{
    fullName: string;
    organization: string | null;
    email: string | null;
    phone: string | null;
    contactType: SchoolCrmContactType;
    notes: string | null;
  }>
) {
  const existing = await prisma.schoolCrmContact.findFirst({
    where: { id: contactId, schoolId }
  });
  if (!existing) return null;
  return prisma.schoolCrmContact.update({
    where: { id: contactId },
    data
  });
}
