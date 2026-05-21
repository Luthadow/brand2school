import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, readBrandSessionCookies } from "../../../../../../../lib/brandAuth";
import { verifyCsrf } from "../../../../../../../lib/csrf";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agreementId: string }> }
): Promise<NextResponse> {
  const { accessToken } = readBrandSessionCookies();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  if (!verifyCsrf(req, "brand")) {
    return NextResponse.json({ message: "Invalid CSRF token." }, { status: 403 });
  }

  const { agreementId } = await params;
  const formData = await req.formData();
  const response = await fetch(
    `${apiBaseUrl()}/api/v1/commercial/brand/agreements/${agreementId}/upload-signed`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData
    }
  );

  const data = await response.json().catch(() => ({ message: "Upload failed." }));
  return NextResponse.json(data, { status: response.status });
}
