import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl } from "../../../../lib/auth";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  const res = await fetch(`${apiBaseUrl()}/api/v1/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
  const data = await res.json().catch(() => ({ message: "Reset failed." }));
  return NextResponse.json(data, { status: res.status });
}
