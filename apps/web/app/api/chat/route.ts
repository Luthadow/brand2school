import { NextRequest, NextResponse } from "next/server";
import { answerChatMessage } from "../../../lib/chatEngine";
import { verifyCsrf } from "../../../lib/csrf";

type ChatBody = {
  message?: unknown;
  quickReply?: unknown;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyCsrf(req)) {
    return NextResponse.json({ message: "Invalid CSRF token." }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as ChatBody | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const quickReply = typeof body?.quickReply === "string" ? body.quickReply.trim() : "";

  if (!message && !quickReply) {
    return NextResponse.json({ message: "Invalid chat message." }, { status: 400 });
  }

  if (message.length > 500 || quickReply.length > 120) {
    return NextResponse.json({ message: "Message too long." }, { status: 400 });
  }

  const response = answerChatMessage({
    message: message || undefined,
    quickReply: quickReply || undefined
  });
  return NextResponse.json(response);
}
