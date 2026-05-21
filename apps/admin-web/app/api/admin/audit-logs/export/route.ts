import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, readSessionCookies } from "../../../../../lib/auth";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { accessToken } = readSessionCookies();
  if (!accessToken) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const query = req.nextUrl.searchParams.toString();
  const upstream = await fetch(`${apiBaseUrl()}/api/v1/admin/audit-logs/export${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "text/csv; charset=utf-8",
      "Content-Disposition": upstream.headers.get("Content-Disposition") ?? "attachment; filename=\"audit-logs.csv\""
    }
  });
}
