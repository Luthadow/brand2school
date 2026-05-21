import { NextRequest, NextResponse } from "next/server";
import {
  apiBaseUrl,
  BRAND_ACCESS_COOKIE,
  BRAND_CSRF_COOKIE,
  BRAND_REFRESH_COOKIE
} from "../../../../../lib/brandAuth";
import { isBrandPortalRole } from "../../../../../lib/brandCookies";
import { createCsrfToken, verifyCsrf } from "../../../../../lib/csrf";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyCsrf(req, "brand")) {
    return NextResponse.json({ message: "Invalid CSRF token." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const loginRes = await fetch(`${apiBaseUrl()}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
  const loginData = await loginRes.json().catch(() => ({ message: "Login failed." }));
  if (!loginRes.ok) return NextResponse.json(loginData, { status: loginRes.status });

  const role = loginData?.user?.role as string | undefined;
  if (!role || !isBrandPortalRole(role)) {
    return NextResponse.json({ message: "Brand partner access requires a brand or admin account." }, { status: 403 });
  }

  const csrfToken = createCsrfToken();
  const response = NextResponse.json({ user: loginData.user });
  response.cookies.set(BRAND_ACCESS_COOKIE, loginData.accessToken, { httpOnly: true, sameSite: "lax", path: "/" });
  response.cookies.set(BRAND_REFRESH_COOKIE, loginData.refreshToken, { httpOnly: true, sameSite: "lax", path: "/" });
  response.cookies.set(BRAND_CSRF_COOKIE, csrfToken, { httpOnly: false, sameSite: "lax", path: "/" });
  return response;
}
