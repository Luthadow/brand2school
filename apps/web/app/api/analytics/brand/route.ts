import { NextRequest, NextResponse } from "next/server";
import { analyticsRequestHeaders } from "../../../../lib/analyticsAuth";
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const campaignId = request.nextUrl.searchParams.get("campaignId");
  const qs = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : "";
  const res = await fetch(`${apiBase}/api/v1/analytics/brand${qs}`, {
    cache: "no-store",
    headers: analyticsRequestHeaders()
  }).catch(() => null);
  if (!res || !res.ok) {
    return NextResponse.json({ message: "Failed to load analytics." }, { status: 502 });
  }
  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}
