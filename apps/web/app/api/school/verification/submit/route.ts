import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, readSessionCookies } from "../../../../../lib/auth";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { accessToken } = readSessionCookies();
  if (!accessToken) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const formData = await req.formData();
  const res = await fetch(`${apiBaseUrl()}/api/v1/schools/verification/submit`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData
  });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" }
  });
}
