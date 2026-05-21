import { randomBytes } from "crypto";
import type { NextRequest } from "next/server";
import { BRAND_CSRF_COOKIE } from "./brandCookies";
import { CSRF_COOKIE } from "./cookies";

export function createCsrfToken(): string {
  return randomBytes(24).toString("hex");
}

export function verifyCsrf(req: NextRequest, scope: "school" | "brand" = "school"): boolean {
  const cookieName = scope === "brand" ? BRAND_CSRF_COOKIE : CSRF_COOKIE;
  const cookieToken = req.cookies.get(cookieName)?.value;
  const headerToken = req.headers.get("x-csrf-token");
  return Boolean(cookieToken && headerToken && cookieToken === headerToken);
}
