import { NextResponse } from "next/server";
import { apiBaseUrl, readBrandSessionCookies } from "../../../../../lib/brandAuth";

/** Same-origin preview for brand portal (avoids broken localhost API_PUBLIC_URL in img src). */
export async function GET(): Promise<NextResponse> {
  const { accessToken } = readBrandSessionCookies();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const response = await fetch(`${apiBaseUrl()}/api/v1/commercial/brand/logo/file`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" }
    });
  }

  const buffer = await response.arrayBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=300"
    }
  });
}
