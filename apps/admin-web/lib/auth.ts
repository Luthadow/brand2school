import { cookies } from "next/headers";

export const ACCESS_COOKIE = "b2s_admin_access_token";
export const REFRESH_COOKIE = "b2s_admin_refresh_token";
export const CSRF_COOKIE = "b2s_admin_csrf_token";

export function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
}

export function readSessionCookies(): { accessToken?: string; refreshToken?: string; csrfToken?: string } {
  const jar = cookies();
  return {
    accessToken: jar.get(ACCESS_COOKIE)?.value,
    refreshToken: jar.get(REFRESH_COOKIE)?.value,
    csrfToken: jar.get(CSRF_COOKIE)?.value
  };
}
