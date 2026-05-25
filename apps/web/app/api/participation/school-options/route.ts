import { NextRequest, NextResponse } from "next/server";

const apiBase = (): string => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const params = req.nextUrl.searchParams;
  const qs = new URLSearchParams();
  const province = params.get("province");
  const district = params.get("district");
  if (province) qs.set("province", province);
  if (district) qs.set("district", district);

  try {
    const res = await fetch(`${apiBase()}/api/v1/participation/school-options?${qs.toString()}`, {
      cache: "no-store"
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Could not load school options." }, { status: 502 });
  }
}
