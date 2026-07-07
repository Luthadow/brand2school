import { NextRequest, NextResponse } from "next/server";
import { analyticsRequestHeaders } from "../../../../../lib/analyticsAuth";
import { apiBaseUrl } from "../../../../../lib/brandAuth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const campaignId = request.nextUrl.searchParams.get("campaignId");
  const qs = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : "";
  const res = await fetch(`${apiBaseUrl()}/api/v1/analytics/brand/code-inventory${qs}`, {
    cache: "no-store",
    headers: analyticsRequestHeaders()
  }).catch(() => null);

  if (!res || !res.ok) {
    return NextResponse.json({ message: "Failed to load code inventory." }, { status: 502 });
  }

  return NextResponse.json(await res.json(), { status: 200 });
}
