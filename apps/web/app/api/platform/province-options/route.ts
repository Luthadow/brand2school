import { NextResponse } from "next/server";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function GET(): Promise<NextResponse> {
  try {
    const res = await fetch(`${apiBase}/api/v1/platform/province-options`, { cache: "force-cache" });
    if (!res.ok) return NextResponse.json([], { status: 200 });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json([]);
  }
}
