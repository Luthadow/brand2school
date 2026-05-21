import { prisma } from "./prisma.js";
import { normalizePhone } from "./phones.js";
import { deliverWhatsAppNow } from "./whatsappDeliver.js";

const BACKOFF_BASE_MS = 30_000;

function nextRetryDelay(attempts: number): Date {
  const delayMs = BACKOFF_BASE_MS * 2 ** Math.max(0, attempts - 1);
  return new Date(Date.now() + delayMs);
}

export async function enqueueWhatsAppMessage(to: string, body: string, templateName?: string): Promise<string> {
  const row = await prisma.whatsAppMessage.create({
    data: {
      toMsisdn: normalizePhone(to),
      body,
      templateName: templateName ?? null
    }
  });
  return row.id;
}

export async function claimNextWhatsAppMessage(): Promise<string | null> {
  const now = new Date();
  const row = await prisma.whatsAppMessage.findFirst({
    where: {
      status: "QUEUED",
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }]
    },
    orderBy: { createdAt: "asc" }
  });

  if (!row || row.attempts >= row.maxAttempts) return null;

  const updated = await prisma.whatsAppMessage.updateMany({
    where: { id: row.id, status: "QUEUED" },
    data: { status: "SENDING", updatedAt: new Date() }
  });

  if (updated.count === 0) return null;
  return row.id;
}

export async function processWhatsAppMessage(id: string): Promise<void> {
  const row = await prisma.whatsAppMessage.findUnique({ where: { id } });
  if (!row || row.status === "SENT") return;

  const result = await deliverWhatsAppNow(row.toMsisdn, row.body, row.templateName);
  const attempts = row.attempts + 1;

  if (result.ok) {
    await prisma.whatsAppMessage.update({
      where: { id },
      data: {
        status: "SENT",
        attempts,
        sentAt: new Date(),
        lastError: null,
        nextRetryAt: null,
        providerMessageId: result.providerMessageId ?? null,
        deliveryStatus: "sent"
      }
    });
    return;
  }

  const failed = attempts >= row.maxAttempts;
  await prisma.whatsAppMessage.update({
    where: { id },
    data: {
      status: failed ? "DEAD_LETTER" : "QUEUED",
      attempts,
      lastError: result.error,
      nextRetryAt: failed ? null : nextRetryDelay(attempts),
      failedAt: failed ? new Date() : undefined,
      deadLetterReason: failed ? result.error : undefined
    }
  });
}

export async function applyWhatsAppDeliveryStatus(
  providerMessageId: string,
  status: string,
  recipientId?: string
): Promise<void> {
  const row = await prisma.whatsAppMessage.findFirst({ where: { providerMessageId } });
  if (!row) return;

  const patch: {
    deliveryStatus: string;
    deliveredAt?: Date;
    readAt?: Date;
    toMsisdn?: string;
  } = { deliveryStatus: status };

  if (status === "delivered") patch.deliveredAt = new Date();
  if (status === "read") {
    patch.readAt = new Date();
    patch.deliveredAt = row.deliveredAt ?? new Date();
  }
  if (recipientId) patch.toMsisdn = normalizePhone(recipientId);

  await prisma.whatsAppMessage.update({ where: { id: row.id }, data: patch });
}
