import { NextResponse } from "next/server";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function GET(): Promise<Response> {
  const upstream = await fetch(`${apiBase}/api/v1/platform/live/stream`, {
    cache: "no-store",
    headers: { Accept: "text/event-stream" },
    signal: AbortSignal.timeout(10_000)
  }).catch(() => null);

  if (!upstream?.ok || !upstream.body) {
    return NextResponse.json({ message: "Live stream unavailable." }, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
