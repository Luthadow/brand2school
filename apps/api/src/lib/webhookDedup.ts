import { prisma } from "./prisma.js";

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export async function isDuplicateWebhookEvent(id: string, source = "whatsapp"): Promise<boolean> {
  const existing = await prisma.webhookDedup.findUnique({ where: { id } });
  if (existing) return true;

  await prisma.webhookDedup.create({ data: { id, source } }).catch(() => null);

  // Best-effort cleanup of old keys
  const cutoff = new Date(Date.now() - MAX_AGE_MS);
  await prisma.webhookDedup.deleteMany({ where: { createdAt: { lt: cutoff } } }).catch(() => null);

  return false;
}
