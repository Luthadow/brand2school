import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, readSessionCookies } from "../../../../lib/auth";
import { verifyCsrf } from "../../../../lib/csrf";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyCsrf(req, "school")) {
    return NextResponse.json({ message: "Invalid CSRF token." }, { status: 403 });
  }

  const { accessToken } = readSessionCookies();
  if (!accessToken) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const body = await req.text();
  const res = await fetch(`${apiBaseUrl()}/api/v1/schools/volunteers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body
  });

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" }
  });
}
