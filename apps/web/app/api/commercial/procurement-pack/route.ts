import { NextRequest, NextResponse } from "next/server";

const apiBase = (): string => process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const ALLOWED_PACKAGES = new Set([
  "SCHOOL_TRANSFORMATION",
  "DISTRICT_TRANSFORMATION",
  "PROVINCIAL_IMPACT",
  "NATIONAL_TRANSFORMATION",
  "GOVERNMENT_INSTITUTIONAL"
]);

export async function GET(req: NextRequest): Promise<NextResponse> {
  const pkg = req.nextUrl.searchParams.get("package");
  const qs =
    pkg && ALLOWED_PACKAGES.has(pkg) ? `?package=${encodeURIComponent(pkg)}` : "";

  const response = await fetch(`${apiBase()}/api/v1/commercial/procurement-pack${qs}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: "Download failed." }));
    return NextResponse.json(data, { status: response.status });
  }

  const buffer = await response.arrayBuffer();
  const disposition = response.headers.get("content-disposition");
  const filename =
    disposition?.match(/filename="([^"]+)"/)?.[1] ?? "Brand2School-Partnership-Pack.zip";

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600"
    }
  });
}
