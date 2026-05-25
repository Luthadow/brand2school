import { NextRequest, NextResponse } from "next/server";
import { serverApiBaseUrl } from "../../../../lib/serverApiBase";

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

  const response = await fetch(`${serverApiBaseUrl()}/api/v1/commercial/procurement-pack${qs}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({
      message:
        response.status === 502 || response.status === 503
          ? "Partnership pack service is temporarily unavailable. Try again shortly."
          : "Download failed."
    }));
    return NextResponse.json(data, { status: response.status });
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("zip") && !contentType.includes("octet-stream")) {
    const data = await response.json().catch(() => ({ message: "Unexpected response from API." }));
    return NextResponse.json(data, { status: 502 });
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
