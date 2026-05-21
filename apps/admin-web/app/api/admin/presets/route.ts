import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../lib/admin-proxy";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const query = req.nextUrl.searchParams.toString();
  return proxyAdminRequest(req, `/api/v1/admin/presets${query ? `?${query}` : ""}`);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  return proxyAdminRequest(req, "/api/v1/admin/presets", {
    method: "POST",
    body,
    requireCsrf: true
  });
}
