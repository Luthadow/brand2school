import { NextResponse } from "next/server";
import { apiBaseUrl, readSessionCookies } from "../../../../lib/auth";

export async function GET(): Promise<NextResponse> {
  const { accessToken } = readSessionCookies();
  if (!accessToken) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const res = await fetch(`${apiBaseUrl()}/api/v1/community/portal`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" }
  });
}
