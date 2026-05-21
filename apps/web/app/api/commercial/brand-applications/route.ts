import { NextRequest, NextResponse } from "next/server";

const apiBase = (): string => process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  const response = await fetch(`${apiBase()}/api/v1/commercial/brand-applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
  const data = await response.json().catch(() => ({ message: "Request failed." }));
  return NextResponse.json(data, { status: response.status });
}
