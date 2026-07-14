import { NextResponse } from "next/server";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function GET(): Promise<NextResponse> {
  try {
    const res = await fetch(`${apiBase}/api/v1/platform/company-profile/pdf`, {
      cache: "no-store"
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: "Failed to generate company profile PDF." }));
      return NextResponse.json(data, { status: res.status });
    }

    const buffer = await res.arrayBuffer();
    const disposition =
      res.headers.get("content-disposition") ??
      'attachment; filename="brand2school-company-profile.pdf"';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ message: "Could not reach API." }, { status: 502 });
  }
}
