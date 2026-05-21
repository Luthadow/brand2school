import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, readSessionCookies } from "../../../../../../lib/auth";
import { verifyCsrf } from "../../../../../../lib/csrf";
import { proxyAdminRequest } from "../../../../../../lib/admin-proxy";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { accessToken } = readSessionCookies();
  if (!accessToken) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  if (!verifyCsrf(req)) {
    return NextResponse.json({ message: "Invalid CSRF token." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const formData = await req.formData();
  const response = await fetch(`${apiBaseUrl()}/api/v1/admin/brands/${id}/logo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData
  });

  const data = await response.json().catch(() => ({ message: "Upload failed." }));
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params;
  return proxyAdminRequest(req, `/api/v1/admin/brands/${id}/logo`, {
    method: "DELETE",
    requireCsrf: true
  });
}
