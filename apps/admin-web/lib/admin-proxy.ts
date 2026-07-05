import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, readSessionCookies } from "./auth";
import { verifyCsrf } from "./csrf";

export async function proxyAdminRequest(
  req: NextRequest,
  urlPath: string,
  init?: { method?: "GET" | "PATCH" | "POST" | "DELETE"; body?: unknown; requireCsrf?: boolean }
): Promise<NextResponse> {
  const { accessToken } = readSessionCookies();
  if (!accessToken) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  if (init?.requireCsrf && !verifyCsrf(req)) {
    return NextResponse.json({ message: "Invalid CSRF token." }, { status: 403 });
  }

  const response = await fetch(`${apiBaseUrl()}${urlPath}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store"
  });

  const data = await response.json().catch(() => ({ message: "Upstream request failed." }));
  return NextResponse.json(data, { status: response.status });
}

export async function proxyAdminPdfRequest(req: NextRequest, urlPath: string): Promise<NextResponse> {
  const { accessToken } = readSessionCookies();
  if (!accessToken) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const response = await fetch(`${apiBaseUrl()}${urlPath}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: "Failed to generate PDF report." }));
    return NextResponse.json(data, { status: response.status });
  }

  const buffer = await response.arrayBuffer();
  const disposition = response.headers.get("content-disposition") ?? 'attachment; filename="brand2school-admin-report.pdf"';
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition
    }
  });
}
