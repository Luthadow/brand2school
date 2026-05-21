import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../../../lib/admin-proxy";

export async function POST(req: NextRequest): Promise<NextResponse> {
  return proxyAdminRequest(req, "/api/v1/admin/commercial/governance/subscriptions/run", {
    method: "POST",
    requireCsrf: true
  });
}
