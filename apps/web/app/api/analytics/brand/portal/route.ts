import { NextResponse } from "next/server";
import { analyticsRequestHeaders } from "../../../../../lib/analyticsAuth";
import { apiBaseUrl } from "../../../../../lib/brandAuth";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaignId");
  const qs = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : "";

  const res = await fetch(`${apiBaseUrl()}/api/v1/analytics/brand/portal${qs}`, {
    cache: "no-store",
    headers: analyticsRequestHeaders()
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" }
  });
}
