import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../../../../lib/admin-proxy";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
): Promise<NextResponse> {
  const { brandId } = await params;
  return proxyAdminRequest(req, `/api/v1/admin/commercial/brands/${brandId}/agreements/generate`, {
    method: "POST",
    requireCsrf: true
  });
}
