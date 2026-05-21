import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../../lib/admin-proxy";

export async function GET(
  req: NextRequest,
  { params }: { params: { schoolId: string } }
): Promise<NextResponse> {
  return proxyAdminRequest(req, `/api/v1/admin/schools/${params.schoolId}/infrastructure`);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { schoolId: string } }
): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  return proxyAdminRequest(req, `/api/v1/admin/schools/${params.schoolId}/infrastructure`, {
    method: "PATCH",
    body,
    requireCsrf: true
  });
}
