import { NextResponse } from "next/server";
import { apiBaseUrl, readBrandSessionCookies } from "../../../../lib/brandAuth";

export async function GET(): Promise<NextResponse> {
  const { accessToken } = readBrandSessionCookies();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const response = await fetch(`${apiBaseUrl()}/api/v1/campaigns/province-options`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });

  const data = await response.json().catch(() => ({ message: "Could not load provinces." }));
  return NextResponse.json(data, { status: response.status });
}
