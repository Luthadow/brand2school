import { NextResponse } from "next/server";
import { apiBaseUrl, readBrandSessionCookies } from "../../../../../../lib/brandAuth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ campaignId: string }> }
): Promise<NextResponse> {
  const { accessToken } = readBrandSessionCookies();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { campaignId } = await params;
  const response = await fetch(
    `${apiBaseUrl()}/api/v1/campaigns/${campaignId}/code-batches/import-template`,
    {
      cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}` }
    }
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
      "Content-Type":
        response.headers.get("content-type") ??
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        response.headers.get("content-disposition") ?? "attachment; filename=product-codes-template.xlsx"
    }
  });
}
