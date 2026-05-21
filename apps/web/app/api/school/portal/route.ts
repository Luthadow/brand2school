import { NextResponse } from "next/server";
import { apiBaseUrl, readSessionCookies } from "../../../../lib/auth";

export async function GET(): Promise<NextResponse> {
  const { accessToken } = readSessionCookies();
  if (!accessToken) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const res = await fetch(`${apiBaseUrl()}/api/v1/schools/portal`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" }
  });
}
