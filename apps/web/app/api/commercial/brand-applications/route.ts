import { NextRequest, NextResponse } from "next/server";
import { serverApiBaseUrl } from "../../../../lib/serverApiBase";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  const response = await fetch(`${serverApiBaseUrl()}/api/v1/commercial/brand-applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
  const data = await response.json().catch(() => ({ message: "Request failed." }));
  return NextResponse.json(data, { status: response.status });
}
