import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, readBrandSessionCookies } from "../../../lib/brandAuth";
import { verifyCsrf } from "../../../lib/csrf";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { accessToken } = readBrandSessionCookies();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  if (!verifyCsrf(req, "brand")) {
    return NextResponse.json({ message: "Invalid CSRF token." }, { status: 403 });
  }

  const body = await req.text();
  const response = await fetch(`${apiBaseUrl()}/api/v1/campaigns`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body
  });

  const data = await response.json().catch(() => ({ message: "Could not create campaign." }));
  return NextResponse.json(data, { status: response.status });
}
