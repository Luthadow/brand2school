import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, ACCESS_COOKIE, CSRF_COOKIE, REFRESH_COOKIE } from "../../../../lib/auth";
import { createCsrfToken } from "../../../../lib/csrf";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  const loginRes = await fetch(`${apiBaseUrl()}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
  const loginData = await loginRes.json().catch(() => ({ message: "Login failed." }));
  if (!loginRes.ok) return NextResponse.json(loginData, { status: loginRes.status });

  const role = loginData?.user?.role as string | undefined;
  if (!role || !["SUPER_ADMIN", "ADMIN_STAFF"].includes(role)) {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
  }

  const csrfToken = createCsrfToken();
  const response = NextResponse.json({ user: loginData.user });
  response.cookies.set(ACCESS_COOKIE, loginData.accessToken, { httpOnly: true, sameSite: "lax", path: "/" });
  response.cookies.set(REFRESH_COOKIE, loginData.refreshToken, { httpOnly: true, sameSite: "lax", path: "/" });
  response.cookies.set(CSRF_COOKIE, csrfToken, { httpOnly: false, sameSite: "lax", path: "/" });
  return response;
}
