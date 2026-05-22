import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../../../lib/admin-proxy";

export async function POST(
  req: NextRequest,
  { params }: { params: { schoolId: string } }
): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  return proxyAdminRequest(req, `/api/v1/admin/school-verification/${params.schoolId}/request-info`, {
    method: "POST",
    body,
    requireCsrf: true
  });
}
