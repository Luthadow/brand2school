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
