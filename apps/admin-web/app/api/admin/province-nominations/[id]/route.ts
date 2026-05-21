import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../lib/admin-proxy";

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }): Promise<NextResponse> {
  const body = await req.json();
  return proxyAdminRequest(req, `/api/v1/admin/province-nominations/${ctx.params.id}/status`, {
    method: "PATCH",
    body,
    requireCsrf: true
  });
}
