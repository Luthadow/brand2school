import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../../../lib/admin-proxy";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
): Promise<NextResponse> {
  const { campaignId } = await params;
  return proxyAdminRequest(req, `/api/v1/admin/commercial/campaigns/${campaignId}/approve-codes`, {
    method: "POST",
    requireCsrf: true
  });
}
