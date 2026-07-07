import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../lib/admin-proxy";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { schoolId: string } }
): Promise<NextResponse> {
  return proxyAdminRequest(req, `/api/v1/admin/verified-schools/${params.schoolId}`, {
    method: "DELETE",
    requireCsrf: true
  });
}
