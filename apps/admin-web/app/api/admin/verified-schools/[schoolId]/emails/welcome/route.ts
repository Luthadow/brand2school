import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../../../lib/admin-proxy";

export async function POST(
  req: NextRequest,
  { params }: { params: { schoolId: string } }
): Promise<NextResponse> {
  return proxyAdminRequest(req, `/api/v1/admin/verified-schools/${params.schoolId}/emails/welcome`, {
    method: "POST",
    body: {},
    requireCsrf: true
  });
}
