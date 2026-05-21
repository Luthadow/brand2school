import { cookies } from "next/headers";
import { BRAND_ACCESS_COOKIE, BRAND_CSRF_COOKIE, BRAND_REFRESH_COOKIE } from "./brandCookies";

export { BRAND_ACCESS_COOKIE, BRAND_CSRF_COOKIE, BRAND_REFRESH_COOKIE };

export function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
}

export function readBrandSessionCookies(): {
  accessToken?: string;
  refreshToken?: string;
  csrfToken?: string;
} {
  const jar = cookies();
  return {
    accessToken: jar.get(BRAND_ACCESS_COOKIE)?.value,
    refreshToken: jar.get(BRAND_REFRESH_COOKIE)?.value,
    csrfToken: jar.get(BRAND_CSRF_COOKIE)?.value
  };
}
