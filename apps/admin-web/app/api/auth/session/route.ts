import { NextResponse } from "next/server";
import { apiBaseUrl, ACCESS_COOKIE, REFRESH_COOKIE, readSessionCookies } from "../../../../lib/auth";

export async function GET(): Promise<NextResponse> {
  const { accessToken, refreshToken } = readSessionCookies();
  if (!accessToken) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const meRequest = async (token: string): Promise<Response> =>
    fetch(`${apiBaseUrl()}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });

  let meRes = await meRequest(accessToken);
  let nextAccessToken = accessToken;
  let nextRefreshToken = refreshToken;

  if (meRes.status === 401 && refreshToken) {
    const refreshRes = await fetch(`${apiBaseUrl()}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });
    if (refreshRes.ok) {
      const refreshData = await refreshRes.json();
      nextAccessToken = refreshData.accessToken;
      nextRefreshToken = refreshData.refreshToken;
      meRes = await meRequest(nextAccessToken);
    }
  }

  if (!meRes.ok) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  const meData = await meRes.json();
  const role = meData?.user?.role as string | undefined;
  if (!role || !["SUPER_ADMIN", "ADMIN_STAFF"].includes(role)) {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
  }

  const response = NextResponse.json(meData);
  if (nextAccessToken !== accessToken) {
    response.cookies.set(ACCESS_COOKIE, nextAccessToken, { httpOnly: true, sameSite: "lax", path: "/" });
  }
  if (nextRefreshToken && nextRefreshToken !== refreshToken) {
    response.cookies.set(REFRESH_COOKIE, nextRefreshToken, { httpOnly: true, sameSite: "lax", path: "/" });
  }
  return response;
}
