import { enqueueWhatsAppMessage } from "./whatsappQueue.js";

export type WhatsAppOutboundResult =
  | { ok: true; mode: "queued" | "logged"; messageId?: string }
  | { ok: false; mode: "failed"; error: string };

/**
 * Queue an outbound WhatsApp message for delivery (processed by whatsapp worker).
 */
export async function sendWhatsAppText(to: string, body: string): Promise<WhatsAppOutboundResult> {
  try {
    const messageId = await enqueueWhatsAppMessage(to, body);
    return { ok: true, mode: "queued", messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to queue WhatsApp message.";
    return { ok: false, mode: "failed", error: message };
  }
}
