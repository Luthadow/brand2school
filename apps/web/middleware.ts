import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BRAND_CSRF_COOKIE } from "./lib/brandCookies";
import { CSRF_COOKIE } from "./lib/cookies";

function createCsrfToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function ensureCsrfCookie(response: NextResponse, request: NextRequest, name: string): void {
  if (!request.cookies.get(name)?.value) {
    response.cookies.set(name, createCsrfToken(), {
      httpOnly: false,
      sameSite: "lax",
      path: "/"
    });
  }
}

export function middleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  ensureCsrfCookie(response, request, CSRF_COOKIE);
  ensureCsrfCookie(response, request, BRAND_CSRF_COOKIE);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
