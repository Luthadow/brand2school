import type { NotificationJob, NotificationTemplate } from "../../generated/prisma/index.js";
import { env } from "../../config/env.js";
import { prisma } from "../prisma.js";
import { logger } from "../logger.js";
import { deliverNotificationTemplate } from "./deliver.js";
import { finalizeEsgScheduleNotification } from "./esgDeliveryHook.js";
import type { NotificationPayloadMap } from "./payloads.js";

const BATCH_SIZE = () => env.NOTIFICATION_BATCH_SIZE;

function retryDelayMs(attempts: number): number {
  return Math.min(60_000, 5_000 * 2 ** Math.max(0, attempts - 1));
}

export async function processNotificationJobById(jobId: string): Promise<boolean> {
  const job = await prisma.notificationJob.findUnique({ where: { id: jobId } });
  if (!job) return false;
  if (job.status === "SENT" || job.status === "FAILED") return job.status === "SENT";

  return processLockedJob(job);
}

async function processLockedJob(job: NotificationJob): Promise<boolean> {
  const now = new Date();

  await prisma.$transaction([
    prisma.notificationJob.update({
      where: { id: job.id },
      data: { status: "PROCESSING", lockedAt: now, attempts: { increment: 1 } }
    }),
    prisma.notificationLog.update({
      where: { id: job.logId },
      data: { status: "PROCESSING" }
    })
  ]);

  const refreshed = await prisma.notificationJob.findUniqueOrThrow({ where: { id: job.id } });

  try {
    const result = await deliverNotificationTemplate(
      refreshed.template,
      refreshed.recipient,
      refreshed.payload as NotificationPayloadMap[NotificationTemplate]
    );

    await prisma.$transaction([
      prisma.notificationJob.update({
        where: { id: job.id },
        data: {
          status: "SENT",
          processedAt: new Date(),
          lockedAt: null,
          lastError: null
        }
      }),
      prisma.notificationLog.update({
        where: { id: job.logId },
        data: {
          status: "SENT",
          subject: result.subject,
          sentAt: new Date(),
          errorMessage: null
        }
      })
    ]);

    await finalizeEsgScheduleNotification(refreshed, true);

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notification delivery failed";
    const failedAttempts = refreshed.attempts;
    const shouldFail = failedAttempts >= refreshed.maxAttempts;

    await prisma.$transaction([
      prisma.notificationJob.update({
        where: { id: job.id },
        data: {
          status: shouldFail ? "FAILED" : "QUEUED",
          processedAt: shouldFail ? new Date() : null,
          lockedAt: null,
          lastError: message,
          scheduledAt: shouldFail ? undefined : new Date(Date.now() + retryDelayMs(failedAttempts))
        }
      }),
      prisma.notificationLog.update({
        where: { id: job.logId },
        data: {
          status: shouldFail ? "FAILED" : "QUEUED",
          errorMessage: message
        }
      })
    ]);

    if (shouldFail && refreshed.template === "ESG_REPORT") {
      await finalizeEsgScheduleNotification(refreshed, false, message);
    }

    logger.error({ jobId: job.id, template: job.template, err: error }, "Notification job failed");
    return false;
  }
}

export async function processDueNotificationJobs(limit = BATCH_SIZE()): Promise<number> {
  const now = new Date();
  const due = await prisma.notificationJob.findMany({
    where: {
      status: "QUEUED",
      scheduledAt: { lte: now }
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: limit * 2
  });

  const eligible = due.filter((job) => job.attempts < job.maxAttempts).slice(0, limit);
  let processed = 0;

  for (const job of eligible) {
    const ok = await processLockedJob(job);
    if (ok) processed += 1;
  }

  return processed;
}
