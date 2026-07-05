import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, readSessionCookies } from "../../../../../../lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { module: string } }
): Promise<NextResponse> {
  const { accessToken } = readSessionCookies();
  if (!accessToken) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const res = await fetch(`${apiBaseUrl()}/api/v1/schools/portal/reports/${params.module}/pdf`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: "Failed to generate PDF report." }));
    return NextResponse.json(data, { status: res.status });
  }

  const buffer = await res.arrayBuffer();
  const disposition =
    res.headers.get("content-disposition") ?? 'attachment; filename="brand2school-school-report.pdf"';
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition
    }
  });
}
