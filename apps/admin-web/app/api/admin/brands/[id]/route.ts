import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../lib/admin-proxy";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params;
  return proxyAdminRequest(req, `/api/v1/admin/brands/${id}`);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  return proxyAdminRequest(req, `/api/v1/admin/brands/${id}`, {
    method: "PATCH",
    body,
    requireCsrf: true
  });
}
