import { NextResponse } from "next/server";

const apiBase = (): string => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type Check = { ok: boolean; detail?: string };

async function probe(path: string, timeoutMs = 6000): Promise<Check> {
  try {
    const res = await fetch(`${apiBase()}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
    return { ok: true, detail: "ok" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "request failed";
    return { ok: false, detail: message };
  }
}

/** Public wiring check: web → API nervous system (no secrets). */
export async function GET(): Promise<NextResponse> {
  const [health, ready, live, credibility, impact] = await Promise.all([
    probe("/health"),
    probe("/health/ready"),
    probe("/api/v1/platform/live"),
    probe("/api/v1/platform/credibility"),
    probe("/api/v1/platform/impact")
  ]);

  const checks = {
    apiBaseUrl: apiBase(),
    health,
    ready,
    platformLive: live,
    platformCredibility: credibility,
    platformImpact: impact
  };

  const ok = health.ok && ready.ok && live.ok;

  return NextResponse.json(
    {
      ok,
      checkedAt: new Date().toISOString(),
      checks
    },
    { status: ok ? 200 : 503 }
  );
}
