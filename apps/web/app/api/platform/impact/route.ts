import { NextResponse } from "next/server";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function GET(): Promise<NextResponse> {
  try {
    const res = await fetch(`${apiBase}/api/v1/platform/impact`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) {
      return NextResponse.json({ message: "Failed to load impact dashboard." }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to load impact dashboard." }, { status: 502 });
  }
}
