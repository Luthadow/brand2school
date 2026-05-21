import { NextResponse } from "next/server";
import { apiBaseUrl, readSessionCookies } from "../../../../lib/auth";

export async function GET(): Promise<NextResponse> {
  const { accessToken } = readSessionCookies();
  if (!accessToken) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const res = await fetch(`${apiBaseUrl()}/api/v1/schools/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  const data = await res.json().catch(() => ({ message: "Failed to load school." }));
  return NextResponse.json(data, { status: res.status });
}
