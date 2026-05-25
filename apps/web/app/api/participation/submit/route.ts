import { NextRequest, NextResponse } from "next/server";

const apiBase = (): string => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const payload = {
    schoolId: body.schoolId,
    schoolName: body.schoolName,
    district: body.district,
    campaignSlug: body.campaignSlug,
    productCode: body.productCode,
    whatsappMsisdn: body.contactPhone ?? body.whatsappMsisdn,
    source: "web"
  };

  const res = await fetch(`${apiBase()}/api/v1/participation/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({ message: "Submission failed." }));
  return NextResponse.json(data, { status: res.status });
}
