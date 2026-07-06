import type { NotificationJob, NotificationTemplate } from "../../generated/prisma/index.js";
import { env } from "../../config/env.js";
import { prisma } from "../prisma.js";
import { logger } from "../logger.js";
import { deliverNotificationTemplate } from "./deliver.js";
import { finalizeEsgScheduleNotification } from "./esgDeliveryHook.js";
import {
  findDuplicateSentSiblingJob,
  markNotificationJobSent,
  recoverStaleNotificationJobs
} from "./idempotency.js";
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

async function skipIfAlreadyDelivered(job: NotificationJob): Promise<boolean> {
  const log = await prisma.notificationLog.findUnique({
    where: { id: job.logId },
    select: { sentAt: true }
  });
  if (log?.sentAt) {
    await markNotificationJobSent(job.id, job.logId, "Recovered previously sent notification");
    logger.info(
      { jobId: job.id, template: job.template, entityId: job.entityId },
      "Skipped notification retry — email was already delivered"
    );
    return true;
  }

  const duplicate = await findDuplicateSentSiblingJob(job);
  if (!duplicate) return false;

  await markNotificationJobSent(job.id, job.logId, "Skipped duplicate welcome email");
  logger.info(
    { jobId: job.id, duplicateJobId: duplicate.id, template: job.template, entityId: job.entityId },
    "Skipped duplicate notification delivery"
  );
  return true;
}

async function processLockedJob(job: NotificationJob): Promise<boolean> {
  const now = new Date();

  const claimed = await prisma.notificationJob.updateMany({
    where: { id: job.id, status: "QUEUED" },
    data: { status: "PROCESSING", lockedAt: now, attempts: { increment: 1 } }
  });
  if (claimed.count === 0) return false;

  await prisma.notificationLog.update({
    where: { id: job.logId },
    data: { status: "PROCESSING" }
  });

  const refreshed = await prisma.notificationJob.findUniqueOrThrow({ where: { id: job.id } });

  if (await skipIfAlreadyDelivered(refreshed)) {
    return true;
  }

  try {
    const result = await deliverNotificationTemplate(
      refreshed.template,
      refreshed.recipient,
      refreshed.payload as NotificationPayloadMap[NotificationTemplate]
    );

    await markNotificationJobSent(job.id, job.logId, result.subject);

    try {
      await finalizeEsgScheduleNotification(refreshed, true);
    } catch (hookError) {
      logger.error({ jobId: job.id, err: hookError }, "Post-send notification hook failed");
    }

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
      try {
        await finalizeEsgScheduleNotification(refreshed, false, message);
      } catch (hookError) {
        logger.error({ jobId: job.id, err: hookError }, "Post-failure ESG hook failed");
      }
    }

    logger.error({ jobId: job.id, template: job.template, err: error }, "Notification job failed");
    return false;
  }
}

export async function processDueNotificationJobs(limit = BATCH_SIZE()): Promise<number> {
  const recovered = await recoverStaleNotificationJobs();
  if (recovered > 0) {
    logger.warn({ recovered }, "Recovered stale notification jobs stuck in PROCESSING");
  }

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
