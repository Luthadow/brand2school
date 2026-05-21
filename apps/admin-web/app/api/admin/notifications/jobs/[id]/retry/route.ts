import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../../../lib/admin-proxy";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params;
  return proxyAdminRequest(req, `/api/v1/admin/notifications/jobs/${id}/retry`, {
    method: "POST",
    requireCsrf: true
  });
}
