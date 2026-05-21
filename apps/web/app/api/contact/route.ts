import { NextRequest, NextResponse } from "next/server";
import { verifyCsrf } from "../../../lib/csrf";

const apiBase = () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyCsrf(req)) {
    return NextResponse.json({ message: "Invalid CSRF token." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const res = await fetch(`${apiBase()}/api/v1/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });

  const data = await res.json().catch(() => ({ message: "Could not send your message." }));
  return NextResponse.json(data, { status: res.status });
}
