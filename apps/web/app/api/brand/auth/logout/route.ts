import { NextRequest, NextResponse } from "next/server";
import {
  apiBaseUrl,
  BRAND_ACCESS_COOKIE,
  BRAND_CSRF_COOKIE,
  BRAND_REFRESH_COOKIE,
  readBrandSessionCookies
} from "../../../../../lib/brandAuth";
import { verifyCsrf } from "../../../../../lib/csrf";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyCsrf(req, "brand")) {
    return NextResponse.json({ message: "Invalid CSRF token." }, { status: 403 });
  }

  const { accessToken, refreshToken } = readBrandSessionCookies();
  if (accessToken && refreshToken) {
    await fetch(`${apiBaseUrl()}/api/v1/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    }).catch(() => null);
    await fetch(`${apiBaseUrl()}/api/v1/auth/sessions/revoke-all`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` }
    }).catch(() => null);
  }

  const response = NextResponse.json({ message: "Logged out." });
  response.cookies.set(BRAND_ACCESS_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set(BRAND_REFRESH_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set(BRAND_CSRF_COOKIE, "", { httpOnly: false, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
