import { NextRequest, NextResponse } from "next/server";
import { proxyAdminPdfRequest } from "../../../../../../lib/admin-proxy";

const allowed = new Set(["overview", "analytics", "commercial", "brands"]);

export async function GET(
  req: NextRequest,
  { params }: { params: { module: string } }
): Promise<NextResponse> {
  if (!allowed.has(params.module)) {
    return NextResponse.json({ message: "Report not found." }, { status: 404 });
  }
  return proxyAdminPdfRequest(req, `/api/v1/admin/reports/${params.module}/pdf`);
}
