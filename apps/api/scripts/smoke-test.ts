import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: "apps/api/.env" });

const API_BASE = process.env.SMOKE_API_BASE ?? `http://localhost:${process.env.PORT ?? "4000"}`;
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? "superadmin@brand2school.co.za";
const PASSWORD = process.env.SMOKE_PASSWORD ?? "ChangeMe123!";

type StepResult = { step: string; ok: boolean; detail?: string };

const results: StepResult[] = [];

function pass(step: string, detail?: string): void {
  results.push({ step, ok: true, detail });
  console.log(`✓ ${step}${detail ? ` — ${detail}` : ""}`);
}

function fail(step: string, detail: string): never {
  results.push({ step, ok: false, detail });
  console.error(`✗ ${step} — ${detail}`);
  throw new Error(`Smoke test failed at: ${step}`);
}

async function jsonFetch<T>(
  path: string,
  init?: RequestInit & { token?: string }
): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined)
  };
  if (init?.token) headers.Authorization = `Bearer ${init.token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, data };
}

async function login(email: string): Promise<string> {
  const { status, data } = await jsonFetch<{ accessToken?: string; message?: string }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: PASSWORD })
  });
  if (status !== 200 || !data.accessToken) {
    fail("auth/login", data.message ?? `HTTP ${status}`);
  }
  return data.accessToken;
}

async function main(): Promise<void> {
  console.log(`\nBrand2School smoke test → ${API_BASE}\n`);

  const health = await fetch(`${API_BASE}/health`);
  if (!health.ok) fail("health", `HTTP ${health.status}`);
  pass("health", "API reachable");

  const ready = await fetch(`${API_BASE}/health/ready`);
  const readyJson = (await ready.json().catch(() => ({}))) as { ok?: boolean; checks?: Record<string, string> };
  if (!ready.ok || !readyJson.ok) {
    fail("readiness", JSON.stringify(readyJson.checks ?? readyJson));
  }
  pass("readiness", readyJson.checks?.seed ?? readyJson.checks?.schema ?? "ok");

  const adminToken = await login(ADMIN_EMAIL);
  pass("super admin login");

  const live = await jsonFetch<{
    dataSource?: string;
    stats?: { schoolsRegistered?: number; activeSchools?: number; validSubmissions?: number };
  }>("/api/v1/platform/live");
  if (live.status !== 200) fail("platform live", `HTTP ${live.status}`);
  const schoolsRegistered = live.data.stats?.schoolsRegistered ?? live.data.stats?.activeSchools ?? 0;
  pass(
    "platform live",
    `${live.data.dataSource ?? "unknown"} — ${schoolsRegistered} schools registered, ${live.data.stats?.validSubmissions ?? 0} verified`
  );

  const queueRes = await jsonFetch<{ pageMeta?: { openFraudFlags?: { total?: number } } }>(
    "/api/v1/admin/queue?module=MODERATION_QUEUE",
    { token: adminToken }
  );
  if (queueRes.status !== 200) fail("admin queue", `HTTP ${queueRes.status}`);
  pass("admin moderation queue", `${queueRes.data.pageMeta?.openFraudFlags?.total ?? 0} open flags`);

  const waTest = await jsonFetch<{ message?: string }>("/api/v1/whatsapp/webhook", {
    method: "POST",
    body: JSON.stringify({ message: "MENU", from: "+27820000000" })
  });
  if (waTest.status !== 200 && waTest.status !== 401) {
    fail("WhatsApp webhook", `HTTP ${waTest.status}`);
  }
  pass("WhatsApp webhook", waTest.status === 401 ? "signature enforced" : "test payload ok");

  const failed = results.filter((r) => !r.ok);
  console.log(`\n✅ ${results.length - failed.length}/${results.length} core checks passed.\n`);
  if (failed.length) process.exit(1);
}

main().catch((error) => {
  console.error("\nSmoke test aborted:", error instanceof Error ? error.message : error);
  process.exit(1);
});
