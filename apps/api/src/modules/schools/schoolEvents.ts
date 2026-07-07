import type { SchoolEventStatus } from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";

export type SchoolEventItem = {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  eventTypeLabel: string;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  volunteerSlots: number;
  volunteersAssigned: number;
  status: SchoolEventStatus;
  volunteers: Array<{ id: string; fullName: string; role: string }>;
  createdAt: string;
};

export const EVENT_TYPES: Record<string, string> = {
  campaign_drive: "Campaign code drive",
  sports: "Sports day",
  fundraiser: "Fundraiser",
  community_meet: "Community meeting",
  volunteer_day: "Volunteer day",
  other: "Other event"
};

export function eventTypeLabel(eventType: string): string {
  return EVENT_TYPES[eventType] ?? eventType;
}

export function serializeEvent(
  row: Awaited<ReturnType<typeof listSchoolEvents>>[number]
): SchoolEventItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    eventType: row.eventType,
    eventTypeLabel: eventTypeLabel(row.eventType),
    location: row.location,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
    volunteerSlots: row.volunteerSlots,
    volunteersAssigned: row.assignments.length,
    status: row.status,
    volunteers: row.assignments.map((a) => ({
      id: a.volunteer.id,
      fullName: a.volunteer.fullName,
      role: a.role ?? a.volunteer.role
    })),
    createdAt: row.createdAt.toISOString()
  };
}

export async function listSchoolEvents(schoolId: string) {
  return prisma.schoolEvent.findMany({
    where: { schoolId, status: { not: "CANCELLED" } },
    include: {
      assignments: {
        include: { volunteer: { select: { id: true, fullName: true, role: true } } }
      }
    },
    orderBy: { startsAt: "asc" }
  });
}

export async function createSchoolEvent(
  schoolId: string,
  data: {
    title: string;
    description?: string | null;
    eventType: string;
    location?: string | null;
    startsAt: Date;
    endsAt?: Date | null;
    volunteerSlots?: number;
    status?: SchoolEventStatus;
  }
) {
  return prisma.schoolEvent.create({
    data: {
      schoolId,
      title: data.title,
      description: data.description ?? null,
      eventType: data.eventType,
      location: data.location ?? null,
      startsAt: data.startsAt,
      endsAt: data.endsAt ?? null,
      volunteerSlots: data.volunteerSlots ?? 0,
      status: data.status ?? "SCHEDULED"
    }
  });
}

export async function updateSchoolEvent(
  schoolId: string,
  eventId: string,
  data: Partial<{
    title: string;
    description: string | null;
    eventType: string;
    location: string | null;
    startsAt: Date;
    endsAt: Date | null;
    volunteerSlots: number;
    status: SchoolEventStatus;
  }>
) {
  const existing = await prisma.schoolEvent.findFirst({
    where: { id: eventId, schoolId }
  });
  if (!existing) return null;
  return prisma.schoolEvent.update({
    where: { id: eventId },
    data
  });
}

export async function assignVolunteerToEvent(
  schoolId: string,
  eventId: string,
  volunteerId: string,
  role?: string
) {
  const [event, volunteer] = await Promise.all([
    prisma.schoolEvent.findFirst({ where: { id: eventId, schoolId } }),
    prisma.schoolVolunteer.findFirst({
      where: { id: volunteerId, schoolId, status: "ACTIVE" }
    })
  ]);
  if (!event || !volunteer) return null;

  return prisma.schoolEventVolunteer.upsert({
    where: { eventId_volunteerId: { eventId, volunteerId } },
    create: { eventId, volunteerId, role: role ?? volunteer.role },
    update: { role: role ?? volunteer.role }
  });
}

export async function listUpcomingPublicEvents(schoolId: string, limit = 4) {
  const rows = await prisma.schoolEvent.findMany({
    where: {
      schoolId,
      status: "SCHEDULED",
      startsAt: { gte: new Date() }
    },
    orderBy: { startsAt: "asc" },
    take: limit
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    eventTypeLabel: eventTypeLabel(row.eventType),
    location: row.location,
    startsAt: row.startsAt.toISOString()
  }));
}
