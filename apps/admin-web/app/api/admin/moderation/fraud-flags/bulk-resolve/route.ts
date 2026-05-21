import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../../lib/admin-proxy";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  return proxyAdminRequest(req, "/api/v1/admin/moderation/fraud-flags/bulk-resolve", {
    method: "POST",
    body,
    requireCsrf: true
  });
}
