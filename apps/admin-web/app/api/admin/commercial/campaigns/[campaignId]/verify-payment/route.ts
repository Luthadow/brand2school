import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../../../lib/admin-proxy";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
): Promise<NextResponse> {
  const { campaignId } = await params;
  const body = await req.json().catch(() => ({}));
  return proxyAdminRequest(req, `/api/v1/admin/commercial/campaigns/${campaignId}/verify-payment`, {
    method: "POST",
    body,
    requireCsrf: true
  });
}
