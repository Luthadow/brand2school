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

const FETCH_TIMEOUT_MS = 6000;

async function probeLiveStats(): Promise<Check & { schoolsRegistered?: number; validSubmissions?: number }> {
  try {
    const res = await fetch(`${apiBase()}/api/v1/platform/live`, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
    const data = (await res.json()) as {
      dataSource?: string;
      stats?: { schoolsRegistered?: number; activeSchools?: number; validSubmissions?: number };
    };
    const schoolsRegistered = data.stats?.schoolsRegistered ?? data.stats?.activeSchools ?? 0;
    const validSubmissions = data.stats?.validSubmissions ?? 0;
    return {
      ok: true,
      detail: `live (${data.dataSource ?? "unknown"}): ${schoolsRegistered} schools registered, ${validSubmissions} verified`,
      schoolsRegistered,
      validSubmissions
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "request failed";
    return { ok: false, detail: message };
  }
}

/** Public wiring check: web → API nervous system (no secrets). */
export async function GET(): Promise<NextResponse> {
  const [health, ready, live, credibility, impact, liveStats] = await Promise.all([
    probe("/health"),
    probe("/health/ready"),
    probe("/api/v1/platform/live"),
    probe("/api/v1/platform/credibility"),
    probe("/api/v1/platform/impact"),
    probeLiveStats()
  ]);

  const checks = {
    apiBaseUrl: apiBase(),
    health,
    ready,
    platformLive: live,
    platformLiveStats: liveStats,
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
