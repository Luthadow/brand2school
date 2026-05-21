import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../../../lib/admin-proxy";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agreementId: string }> }
): Promise<NextResponse> {
  const { agreementId } = await params;
  const body = await req.json().catch(() => ({ approved: true }));
  return proxyAdminRequest(req, `/api/v1/admin/commercial/agreements/${agreementId}/approve`, {
    method: "POST",
    body,
    requireCsrf: true
  });
}
