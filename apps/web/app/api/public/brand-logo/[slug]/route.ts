import { NextResponse } from "next/server";
import { serverApiBaseUrl } from "../../../../../lib/serverApiBase";

/** Public brand logo — proxied from API DB storage (survives Railway redeploy). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;
  const response = await fetch(
    `${serverApiBaseUrl()}/api/v1/platform/brand-logo/${encodeURIComponent(slug)}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" }
    });
  }

  const buffer = await response.arrayBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
