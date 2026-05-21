export type InboundWhatsAppMessage = {
  messageId: string;
  from: string;
  text: string;
};

export type InboundWhatsAppStatus = {
  messageId: string;
  status: string;
  recipientId?: string;
};

export function parseInboundWhatsApp(body: unknown):
  | { kind: "message"; data: InboundWhatsAppMessage }
  | { kind: "status"; data: InboundWhatsAppStatus }
  | { kind: "test"; data: { message: string; from?: string } }
  | null {
  if (!body || typeof body !== "object") return null;

  const test = body as { message?: string; from?: string };
  if (typeof test.message === "string") {
    return { kind: "test", data: { message: test.message, from: test.from } };
  }

  const entry = (body as { entry?: Array<{ changes?: Array<{ value?: Record<string, unknown> }> }> }).entry?.[0];
  const value = entry?.changes?.[0]?.value;
  if (!value) return null;

  const messages = value.messages as Array<{ id?: string; from?: string; text?: { body?: string } }> | undefined;
  const first = messages?.[0];
  if (first?.id && first.from && first.text?.body) {
    return {
      kind: "message",
      data: { messageId: first.id, from: first.from, text: first.text.body }
    };
  }

  const statuses = value.statuses as Array<{ id?: string; status?: string; recipient_id?: string }> | undefined;
  const status = statuses?.[0];
  if (status?.id && status.status) {
    return {
      kind: "status",
      data: { messageId: status.id, status: status.status, recipientId: status.recipient_id }
    };
  }

  return null;
}
