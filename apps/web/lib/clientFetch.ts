import { CSRF_COOKIE } from "./cookies";
import { BRAND_CSRF_COOKIE } from "./brandCookies";

export function readCsrfToken(scope: "school" | "brand" = "school"): string | null {
  if (typeof document === "undefined") return null;
  const cookieName = scope === "brand" ? BRAND_CSRF_COOKIE : CSRF_COOKIE;
  const prefix = `${cookieName}=`;
  const match = document.cookie.split("; ").find((row) => row.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

export function csrfHeaders(scope: "school" | "brand" = "school"): Record<string, string> {
  const token = readCsrfToken(scope);
  return token ? { "x-csrf-token": token } : {};
}

export function brandCsrfHeaders(): Record<string, string> {
  return csrfHeaders("brand");
}
