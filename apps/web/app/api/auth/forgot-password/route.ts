import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl } from "../../../../lib/auth";
import { verifyCsrf } from "../../../../lib/csrf";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyCsrf(req)) {
    return NextResponse.json({ message: "Invalid CSRF token." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const res = await fetch(`${apiBaseUrl()}/api/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
  const data = await res.json().catch(() => ({ message: "Request failed." }));
  return NextResponse.json(data, { status: res.status });
}
