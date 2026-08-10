import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, readBrandSessionCookies } from "../../../../../lib/brandAuth";
import { verifyCsrf } from "../../../../../lib/csrf";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
): Promise<NextResponse> {
  const { accessToken } = readBrandSessionCookies();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  if (!verifyCsrf(req, "brand")) {
    return NextResponse.json({ message: "Invalid CSRF token." }, { status: 403 });
  }

  const { campaignId } = await params;
  const body = await req.json().catch(() => ({}));
  const response = await fetch(`${apiBaseUrl()}/api/v1/campaigns/${campaignId}/setup`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({ message: "Could not update campaign." }));
  return NextResponse.json(data, { status: response.status });
}
