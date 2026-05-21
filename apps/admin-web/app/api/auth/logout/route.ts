import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, ACCESS_COOKIE, CSRF_COOKIE, REFRESH_COOKIE, readSessionCookies } from "../../../../lib/auth";
import { verifyCsrf } from "../../../../lib/csrf";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyCsrf(req)) return NextResponse.json({ message: "Invalid CSRF token." }, { status: 403 });

  const { accessToken, refreshToken } = readSessionCookies();
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
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  response.cookies.delete(CSRF_COOKIE);
  return response;
}
