import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../../../lib/admin-proxy";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
): Promise<NextResponse> {
  const { brandId } = await params;
  const body = await req.json().catch(() => ({}));
  return proxyAdminRequest(req, `/api/v1/admin/commercial/brands/${brandId}/review`, {
    method: "PATCH",
    body,
    requireCsrf: true
  });
}
