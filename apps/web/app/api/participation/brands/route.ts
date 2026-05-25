import { NextResponse } from "next/server";

const apiBase = (): string => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function GET(): Promise<NextResponse> {
  try {
    const res = await fetch(`${apiBase()}/api/v1/participation/brands`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
    const data = await res.json().catch(() => ({ brands: [] }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ brands: [] }, { status: 502 });
  }
}
