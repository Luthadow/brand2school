import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, ACCESS_COOKIE, CSRF_COOKIE, REFRESH_COOKIE } from "../../../../lib/auth";
import { createCsrfToken } from "../../../../lib/csrf";
import { verifyCsrf } from "../../../../lib/csrf";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyCsrf(req, "school")) {
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
  if (role !== "SCHOOL_ADMIN") {
    return NextResponse.json({ message: "Organisation portal access requires a school or partner account." }, { status: 403 });
  }

  const csrfToken = createCsrfToken();
  const response = NextResponse.json({ user: loginData.user });
  response.cookies.set(ACCESS_COOKIE, loginData.accessToken, { httpOnly: true, sameSite: "lax", path: "/" });
  response.cookies.set(REFRESH_COOKIE, loginData.refreshToken, { httpOnly: true, sameSite: "lax", path: "/" });
  response.cookies.set(CSRF_COOKIE, csrfToken, { httpOnly: false, sameSite: "lax", path: "/" });
  return response;
}
