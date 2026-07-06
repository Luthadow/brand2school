import type { NotificationTemplate } from "../../generated/prisma/index.js";
import { prisma } from "../prisma.js";
import type { QueueEmailInput } from "./dispatch.js";

export const WELCOME_IDEMPOTENT_TEMPLATES = new Set<NotificationTemplate>([
  "SCHOOL_REGISTRATION",
  "SCHOOL_APPROVED"
]);

function allowDuplicateQueue(metadata?: Record<string, unknown>): boolean {
  return metadata?.source === "admin_verified_welcome_resend";
}

export async function findSentNotificationDuplicate(
  input: Pick<QueueEmailInput, "template" | "recipient" | "entityType" | "entityId" | "metadata">
): Promise<string | null> {
  if (!WELCOME_IDEMPOTENT_TEMPLATES.has(input.template)) return null;
  if (allowDuplicateQueue(input.metadata)) return null;
  if (!input.entityId) return null;

  const existing = await prisma.notificationJob.findFirst({
    where: {
      template: input.template,
      entityId: input.entityId,
      entityType: input.entityType,
      recipient: input.recipient,
      status: "SENT"
    },
    orderBy: { processedAt: "desc" },
    select: { id: true }
  });

  return existing?.id ?? null;
}

export async function findDuplicateSentSiblingJob(
  job: {
    id: string;
    template: NotificationTemplate;
    recipient: string;
    entityType: string | null;
    entityId: string | null;
  }
): Promise<{ id: string } | null> {
  if (!WELCOME_IDEMPOTENT_TEMPLATES.has(job.template) || !job.entityId) return null;

  return prisma.notificationJob.findFirst({
    where: {
      template: job.template,
      entityId: job.entityId,
      entityType: job.entityType,
      recipient: job.recipient,
      status: "SENT",
      id: { not: job.id }
    },
    select: { id: true }
  });
}

export async function markNotificationJobSent(
  jobId: string,
  logId: string,
  subject: string
): Promise<void> {
  const now = new Date();
  await prisma.$transaction([
    prisma.notificationJob.update({
      where: { id: jobId },
      data: {
        status: "SENT",
        processedAt: now,
        lockedAt: null,
        lastError: null
      }
    }),
    prisma.notificationLog.update({
      where: { id: logId },
      data: {
        status: "SENT",
        subject,
        sentAt: now,
        errorMessage: null
      }
    })
  ]);
}

export async function recoverStaleNotificationJobs(staleMs = 15 * 60 * 1000): Promise<number> {
  const cutoff = new Date(Date.now() - staleMs);
  const result = await prisma.notificationJob.updateMany({
    where: {
      status: "PROCESSING",
      lockedAt: { lt: cutoff }
    },
    data: {
      status: "QUEUED",
      lockedAt: null,
      scheduledAt: new Date()
    }
  });
  return result.count;
}
