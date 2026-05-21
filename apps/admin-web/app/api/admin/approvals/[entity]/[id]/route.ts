import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "../../../../../../lib/admin-proxy";

const map: Record<string, string> = {
  users: "users",
  schools: "schools",
  brands: "brands"
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { entity: string; id: string } }
): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  const entity = map[params.entity];
  if (!entity) return NextResponse.json({ message: "Invalid entity." }, { status: 400 });
  return proxyAdminRequest(req, `/api/v1/admin/approvals/${entity}/${params.id}/status`, {
    method: "PATCH",
    body,
    requireCsrf: true
  });
}
