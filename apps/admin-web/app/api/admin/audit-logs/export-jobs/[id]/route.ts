import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../../lib/admin-proxy";

export async function GET(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  return proxyAdminRequest(req, `/api/v1/admin/audit-logs/export-jobs/${params.id}`);
}
