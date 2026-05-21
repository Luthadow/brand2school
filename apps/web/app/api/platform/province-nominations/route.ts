import { NextRequest, NextResponse } from "next/server";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const res = await fetch(`${apiBase}/api/v1/platform/province-nominations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({ message: "Request failed." }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Could not reach API." }, { status: 502 });
  }
}
