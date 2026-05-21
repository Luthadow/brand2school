import { NextResponse } from "next/server";
import { apiBaseUrl, BRAND_ACCESS_COOKIE, BRAND_REFRESH_COOKIE, readBrandSessionCookies } from "../../../../../lib/brandAuth";
import { isBrandPortalRole } from "../../../../../lib/brandCookies";

export async function GET(): Promise<NextResponse> {
  const { accessToken, refreshToken } = readBrandSessionCookies();
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

  if (!meRes.ok) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const meData = await meRes.json();
  if (!isBrandPortalRole(meData?.user?.role ?? "")) {
    return NextResponse.json({ message: "Brand partner access required." }, { status: 403 });
  }

  const response = NextResponse.json(meData);
  if (nextAccessToken !== accessToken) {
    response.cookies.set(BRAND_ACCESS_COOKIE, nextAccessToken, { httpOnly: true, sameSite: "lax", path: "/" });
  }
  if (nextRefreshToken && nextRefreshToken !== refreshToken) {
    response.cookies.set(BRAND_REFRESH_COOKIE, nextRefreshToken, { httpOnly: true, sameSite: "lax", path: "/" });
  }
  return response;
}
