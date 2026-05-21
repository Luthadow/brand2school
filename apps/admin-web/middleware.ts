import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/api/admin"];

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const requiresAuth = protectedPaths.some((path) => pathname.startsWith(path));
  if (!requiresAuth) return NextResponse.next();

  const accessToken = req.cookies.get("b2s_admin_access_token")?.value;
  if (!accessToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*"]
};
