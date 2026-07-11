import { NextRequest, NextResponse } from "next/server";
import { proxyAdminPdfRequest } from "../../../../../../../../lib/admin-proxy";

export async function GET(
  req: NextRequest,
  { params }: { params: { brandId: string } }
): Promise<NextResponse> {
  return proxyAdminPdfRequest(
    req,
    `/api/v1/admin/brand-wishlist/brands/${encodeURIComponent(params.brandId)}/report/pdf`
  );
}
