import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, readBrandSessionCookies } from "../../../../../../lib/brandAuth";
import { verifyCsrf } from "../../../../../../lib/csrf";

export async function POST(
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
  const formData = await req.formData();
  const response = await fetch(
    `${apiBaseUrl()}/api/v1/campaigns/${campaignId}/code-batches/validate-file`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData
    }
  );

  const data = await response.json().catch(() => ({ message: "Validation failed." }));
  return NextResponse.json(data, { status: response.status });
}
