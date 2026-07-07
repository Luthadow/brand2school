import type { SchoolCrmTaskPriority, SchoolCrmTaskStatus } from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";
import { CONTACT_TYPE_LABELS } from "./schoolCrmContacts.js";

export type SchoolCrmTaskItem = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  status: SchoolCrmTaskStatus;
  priority: SchoolCrmTaskPriority;
  isOverdue: boolean;
  contactId: string | null;
  contactName: string | null;
  createdAt: string;
};

export function serializeCrmTask(
  row: Awaited<ReturnType<typeof listSchoolCrmTasks>>[number]
): SchoolCrmTaskItem {
  const now = Date.now();
  const isOverdue =
    row.status === "OPEN" && row.dueAt != null && row.dueAt.getTime() < now;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueAt: row.dueAt?.toISOString() ?? null,
    status: row.status,
    priority: row.priority,
    isOverdue,
    contactId: row.contactId,
    contactName: row.contact?.fullName ?? null,
    createdAt: row.createdAt.toISOString()
  };
}

export async function listSchoolCrmTasks(schoolId: string) {
  return prisma.schoolCrmTask.findMany({
    where: { schoolId, status: { not: "CANCELLED" } },
    include: { contact: { select: { fullName: true } } },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }]
  });
}

export async function createSchoolCrmTask(
  schoolId: string,
  data: {
    title: string;
    description?: string | null;
    dueAt?: Date | null;
    priority?: SchoolCrmTaskPriority;
    contactId?: string | null;
  }
) {
  if (data.contactId) {
    const contact = await prisma.schoolCrmContact.findFirst({
      where: { id: data.contactId, schoolId }
    });
    if (!contact) return null;
  }

  return prisma.schoolCrmTask.create({
    data: {
      schoolId,
      title: data.title,
      description: data.description ?? null,
      dueAt: data.dueAt ?? null,
      priority: data.priority ?? "MEDIUM",
      status: "OPEN",
      contactId: data.contactId ?? null
    }
  });
}

export async function updateSchoolCrmTask(
  schoolId: string,
  taskId: string,
  data: Partial<{
    title: string;
    description: string | null;
    dueAt: Date | null;
    status: SchoolCrmTaskStatus;
    priority: SchoolCrmTaskPriority;
    contactId: string | null;
  }>
) {
  const existing = await prisma.schoolCrmTask.findFirst({
    where: { id: taskId, schoolId }
  });
  if (!existing) return null;
  return prisma.schoolCrmTask.update({
    where: { id: taskId },
    data
  });
}
