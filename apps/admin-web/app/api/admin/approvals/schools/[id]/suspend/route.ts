import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../../../lib/admin-proxy";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return proxyAdminRequest(req, `/api/v1/admin/approvals/schools/${params.id}/suspend`, {
    method: "PATCH",
    requireCsrf: true
  });
}
