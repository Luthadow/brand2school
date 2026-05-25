import { prisma } from "../../lib/prisma.js";
import type { WhatsAppSessionData, WhatsAppStep } from "./conversationTypes.js";
import { WA_SESSION_TTL_MS } from "./conversationTypes.js";

export async function getWhatsAppSession(msisdn: string): Promise<{
  step: WhatsAppStep;
  data: WhatsAppSessionData;
} | null> {
  const row = await prisma.whatsAppConversation.findUnique({ where: { msisdn } });
  if (!row) return null;
  if (Date.now() - row.updatedAt.getTime() > WA_SESSION_TTL_MS) {
    await prisma.whatsAppConversation.delete({ where: { msisdn } }).catch(() => null);
    return null;
  }
  return {
    step: row.step as WhatsAppStep,
    data: (row.data ?? {}) as WhatsAppSessionData
  };
}

export async function saveWhatsAppSession(
  msisdn: string,
  step: WhatsAppStep,
  data: WhatsAppSessionData
): Promise<void> {
  await prisma.whatsAppConversation.upsert({
    where: { msisdn },
    create: { msisdn, step, data },
    update: { step, data }
  });
}

export async function clearWhatsAppSession(msisdn: string): Promise<void> {
  await prisma.whatsAppConversation.delete({ where: { msisdn } }).catch(() => null);
}
