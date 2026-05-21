import type { Prisma } from "../../generated/prisma/index.js";
import type { NotificationTemplate } from "../../generated/prisma/index.js";
import { env } from "../../config/env.js";
import { prisma } from "../prisma.js";
import type { NotificationPayloadMap } from "./payloads.js";

export type QueueEmailInput<T extends NotificationTemplate = NotificationTemplate> = {
  template: T;
  recipient: string;
  payload: NotificationPayloadMap[T];
  entityType?: string;
  entityId?: string;
  priority?: number;
  scheduledAt?: Date;
  /** Process inline after queueing (password reset, contact form). */
  immediate?: boolean;
  metadata?: Record<string, unknown>;
};

function useSyncDelivery(): boolean {
  return env.NOTIFICATION_DELIVERY === "sync";
}

async function createQueuedEmail<T extends NotificationTemplate>(
  tx: Prisma.TransactionClient,
  input: QueueEmailInput<T>
): Promise<string> {
  const log = await tx.notificationLog.create({
    data: {
      channel: "EMAIL",
      template: input.template,
      recipient: input.recipient,
      status: "QUEUED",
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined
    }
  });

  const job = await tx.notificationJob.create({
    data: {
      channel: "EMAIL",
      template: input.template,
      recipient: input.recipient,
      payload: input.payload as Prisma.InputJsonValue,
      status: "QUEUED",
      priority: input.priority ?? 0,
      scheduledAt: input.scheduledAt ?? new Date(),
      entityType: input.entityType,
      entityId: input.entityId,
      logId: log.id
    }
  });

  return job.id;
}

export async function queueEmail<T extends NotificationTemplate>(
  input: QueueEmailInput<T>
): Promise<string> {
  const jobId = await prisma.$transaction((tx) => createQueuedEmail(tx, input));

  if (input.immediate || useSyncDelivery()) {
    const { processNotificationJobById } = await import("./process.js");
    await processNotificationJobById(jobId);
  }

  return jobId;
}

export async function queueEmails<T extends NotificationTemplate>(
  inputs: QueueEmailInput<T>[]
): Promise<number> {
  if (inputs.length === 0) return 0;

  const jobIds: string[] = [];
  const BATCH = 50;

  for (let i = 0; i < inputs.length; i += BATCH) {
    const slice = inputs.slice(i, i + BATCH);
    const ids = await prisma.$transaction(async (tx) => {
      const created: string[] = [];
      for (const input of slice) {
        created.push(await createQueuedEmail(tx, input));
      }
      return created;
    });
    jobIds.push(...ids);
  }

  if (useSyncDelivery()) {
    const { processNotificationJobById } = await import("./process.js");
    for (const jobId of jobIds) {
      await processNotificationJobById(jobId);
    }
  }

  return jobIds.length;
}
