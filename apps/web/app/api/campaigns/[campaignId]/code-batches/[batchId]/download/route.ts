import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, readBrandSessionCookies } from "../../../../../../../lib/brandAuth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ campaignId: string; batchId: string }> }
): Promise<NextResponse> {
  const { accessToken } = readBrandSessionCookies();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { campaignId, batchId } = await params;
  const response = await fetch(
    `${apiBaseUrl()}/api/v1/campaigns/${campaignId}/code-batches/${batchId}/download`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: "Download failed." }));
    return NextResponse.json(data, { status: response.status });
  }

  const csv = await response.text();
  const disposition = response.headers.get("content-disposition") ?? 'attachment; filename="codes.csv"';
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": disposition
    }
  });
}
