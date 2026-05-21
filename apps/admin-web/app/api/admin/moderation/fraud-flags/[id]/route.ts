import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../../lib/admin-proxy";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  return proxyAdminRequest(req, `/api/v1/admin/moderation/fraud-flags/${params.id}/resolve`, {
    method: "PATCH",
    body,
    requireCsrf: true
  });
}
