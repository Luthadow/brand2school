import { NextRequest, NextResponse } from "next/server";
import { analyticsRequestHeaders } from "../../../../../../../lib/analyticsAuth";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function GET(
  request: NextRequest,
  { params }: { params: { module: string } }
): Promise<NextResponse> {
  const campaignId = request.nextUrl.searchParams.get("campaignId");
  const qs = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : "";
  const res = await fetch(`${apiBase}/api/v1/analytics/brand/reports/${params.module}/pdf${qs}`, {
    cache: "no-store",
    headers: analyticsRequestHeaders()
  }).catch(() => null);

  if (!res || !res.ok) {
    const data = res ? await res.json().catch(() => ({})) : {};
    return NextResponse.json(
      { message: (data as { message?: string }).message ?? "Failed to generate PDF report." },
      { status: res?.status ?? 502 }
    );
  }

  const buffer = await res.arrayBuffer();
  const disposition =
    res.headers.get("content-disposition") ?? 'attachment; filename="brand2school-brand-report.pdf"';
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition
    }
  });
}
