import { cookies } from "next/headers";
import { ACCESS_COOKIE, CSRF_COOKIE, REFRESH_COOKIE } from "./cookies";

export { ACCESS_COOKIE, CSRF_COOKIE, REFRESH_COOKIE };

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
