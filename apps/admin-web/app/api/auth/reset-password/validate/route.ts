import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl } from "../../../../../lib/auth";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const res = await fetch(
    `${apiBaseUrl()}/api/v1/auth/reset-password/validate?token=${encodeURIComponent(token)}`,
    { cache: "no-store" }
  );
  const data = await res.json().catch(() => ({ valid: false }));
  return NextResponse.json(data, { status: res.status });
}
