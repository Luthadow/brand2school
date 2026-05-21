import { env } from "../config/env.js";
import { normalizePhone } from "./phones.js";

export type DeliverResult =
  | { ok: true; providerMessageId?: string }
  | { ok: false; error: string };

export async function deliverWhatsAppNow(
  to: string,
  body: string,
  templateName?: string | null
): Promise<DeliverResult> {
  const token = env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log(`[whatsapp:outbound:dev] to=${normalizePhone(to)} template=${templateName ?? "text"}\n${body}`);
    return { ok: true };
  }

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
  const normalizedTo = normalizePhone(to).replace(/^\+/, "");

  const payload = templateName
    ? {
        messaging_product: "whatsapp",
        to: normalizedTo,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components: body
            ? [
                {
                  type: "body",
                  parameters: [{ type: "text", text: body }]
                }
              ]
            : undefined
        }
      }
    : {
        messaging_product: "whatsapp",
        to: normalizedTo,
        type: "text",
        text: { body }
      };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  }).catch(() => null);

  if (!res) {
    return { ok: false, error: "Network error calling WhatsApp API." };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false, error: detail || `WhatsApp API ${res.status}` };
  }

  const json = (await res.json().catch(() => null)) as { messages?: Array<{ id?: string }> } | null;
  return { ok: true, providerMessageId: json?.messages?.[0]?.id };
}

/** @deprecated use deliverWhatsAppNow */
export const deliverWhatsAppTextNow = deliverWhatsAppNow;
