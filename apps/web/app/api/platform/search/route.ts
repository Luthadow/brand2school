import { NextRequest, NextResponse } from "next/server";

const apiBase = (): string => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const params = req.nextUrl.searchParams;
  const qs = new URLSearchParams();
  const q = params.get("q")?.trim();
  const type = params.get("type");
  const limit = params.get("limit");

  if (!q || q.length < 2) {
    return NextResponse.json({ message: "Enter at least 2 characters to search." }, { status: 400 });
  }

  qs.set("q", q);
  if (type) qs.set("type", type);
  if (limit) qs.set("limit", limit);

  try {
    const res = await fetch(`${apiBase()}/api/v1/platform/search?${qs.toString()}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Search is temporarily unavailable." }, { status: 502 });
  }
}
