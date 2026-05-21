import { NextRequest, NextResponse } from "next/server";
import { analyticsRequestHeaders } from "../../../../../lib/analyticsAuth";
import { apiBaseUrl } from "../../../../../lib/brandAuth";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/commercial/brand/onboarding`, {
    cache: "no-store",
    headers: analyticsRequestHeaders()
  }).catch(() => null);

  if (!res) {
    return NextResponse.json({ message: "Could not reach API." }, { status: 502 });
  }
  const data = await res.json().catch(() => ({ message: "Invalid response." }));
  return NextResponse.json(data, { status: res.status });
}
