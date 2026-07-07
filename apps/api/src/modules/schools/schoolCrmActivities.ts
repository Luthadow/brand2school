import type { SchoolCrmActivityType } from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";
import { CONTACT_TYPE_LABELS } from "./schoolCrmContacts.js";

export const ACTIVITY_TYPE_LABELS: Record<SchoolCrmActivityType, string> = {
  MEETING: "Meeting",
  CALL: "Phone call",
  EMAIL: "Email",
  SUPPORT: "Support request",
  NOTE: "Note",
  DOCUMENT: "Document",
  CAMPAIGN: "Campaign",
  RENEWAL: "Renewal"
};

export type SchoolCrmActivityItem = {
  id: string;
  activityType: SchoolCrmActivityType;
  activityTypeLabel: string;
  title: string;
  summary: string | null;
  occurredAt: string;
  contactId: string | null;
  contactName: string | null;
  contactTypeLabel: string | null;
  createdAt: string;
};

export function serializeCrmActivity(
  row: Awaited<ReturnType<typeof listSchoolCrmActivities>>[number]
): SchoolCrmActivityItem {
  return {
    id: row.id,
    activityType: row.activityType,
    activityTypeLabel: ACTIVITY_TYPE_LABELS[row.activityType],
    title: row.title,
    summary: row.summary,
    occurredAt: row.occurredAt.toISOString(),
    contactId: row.contactId,
    contactName: row.contact?.fullName ?? null,
    contactTypeLabel: row.contact ? CONTACT_TYPE_LABELS[row.contact.contactType] : null,
    createdAt: row.createdAt.toISOString()
  };
}

export async function listSchoolCrmActivities(schoolId: string, limit = 50) {
  return prisma.schoolCrmActivity.findMany({
    where: { schoolId },
    include: { contact: { select: { fullName: true, contactType: true } } },
    orderBy: { occurredAt: "desc" },
    take: limit
  });
}

export async function createSchoolCrmActivity(
  schoolId: string,
  data: {
    activityType: SchoolCrmActivityType;
    title: string;
    summary?: string | null;
    occurredAt: Date;
    contactId?: string | null;
  }
) {
  if (data.contactId) {
    const contact = await prisma.schoolCrmContact.findFirst({
      where: { id: data.contactId, schoolId }
    });
    if (!contact) return null;
  }

  return prisma.schoolCrmActivity.create({
    data: {
      schoolId,
      activityType: data.activityType,
      title: data.title,
      summary: data.summary ?? null,
      occurredAt: data.occurredAt,
      contactId: data.contactId ?? null
    }
  });
}

export async function updateSchoolCrmActivity(
  schoolId: string,
  activityId: string,
  data: Partial<{
    activityType: SchoolCrmActivityType;
    title: string;
    summary: string | null;
    occurredAt: Date;
    contactId: string | null;
  }>
) {
  const existing = await prisma.schoolCrmActivity.findFirst({
    where: { id: activityId, schoolId }
  });
  if (!existing) return null;
  return prisma.schoolCrmActivity.update({
    where: { id: activityId },
    data
  });
}
