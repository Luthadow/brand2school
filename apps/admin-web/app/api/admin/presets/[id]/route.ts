import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../lib/admin-proxy";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  return proxyAdminRequest(req, `/api/v1/admin/presets/${params.id}`, {
    method: "DELETE",
    requireCsrf: true
  });
}
