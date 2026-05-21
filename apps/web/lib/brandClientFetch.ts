import { BRAND_CSRF_COOKIE } from "./brandCookies";

export function readBrandCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${BRAND_CSRF_COOKIE}=`;
  const match = document.cookie.split("; ").find((row) => row.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

export function brandCsrfHeaders(): Record<string, string> {
  const token = readBrandCsrfToken();
  return token ? { "x-csrf-token": token } : {};
}
