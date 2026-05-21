import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, readSessionCookies } from "../../../../../../../lib/auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const { accessToken } = readSessionCookies();
  if (!accessToken) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const upstream = await fetch(`${apiBaseUrl()}/api/v1/admin/audit-logs/export-jobs/${params.id}/download`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "text/csv; charset=utf-8",
      "Content-Disposition":
        upstream.headers.get("Content-Disposition") ?? `attachment; filename="audit-export-${params.id}.csv"`
    }
  });
}
