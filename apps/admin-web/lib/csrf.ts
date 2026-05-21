import { randomBytes } from "crypto";
import type { NextRequest } from "next/server";
import { CSRF_COOKIE } from "./auth";

export function createCsrfToken(): string {
  return randomBytes(24).toString("hex");
}

export function verifyCsrf(req: NextRequest): boolean {
  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = req.headers.get("x-csrf-token");
  return Boolean(cookieToken && headerToken && cookieToken === headerToken);
}
