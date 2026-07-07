import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, readBrandSessionCookies } from "../../../../../lib/brandAuth";
import { verifyCsrf } from "../../../../../lib/csrf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
): Promise<NextResponse> {
  const { accessToken } = readBrandSessionCookies();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { campaignId } = await params;
  const response = await fetch(`${apiBaseUrl()}/api/v1/campaigns/${campaignId}/activation`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });

  const data = await response.json().catch(() => ({ message: "Could not load activation status." }));
  return NextResponse.json(data, { status: response.status });
}
