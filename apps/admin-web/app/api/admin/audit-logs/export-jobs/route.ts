import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../lib/admin-proxy";

export async function GET(req: NextRequest): Promise<NextResponse> {
  return proxyAdminRequest(req, "/api/v1/admin/audit-logs/export-jobs");
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  return proxyAdminRequest(req, "/api/v1/admin/audit-logs/export-jobs", {
    method: "POST",
    body,
    requireCsrf: true
  });
}
