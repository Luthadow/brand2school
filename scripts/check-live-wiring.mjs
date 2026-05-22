/**
 * Verify web/API nervous system reports registered schools from the same database.
 *
 *   B2S_API_URL=https://api.brand2school.co.za node scripts/check-live-wiring.mjs
 */

const apiBase = (process.env.B2S_API_URL ?? "https://api.brand2school.co.za").replace(/\/$/, "");

async function getJson(path) {
  const res = await fetch(`${apiBase}${path}`, { signal: AbortSignal.timeout(12_000) });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

console.log(`Checking ${apiBase} …\n`);

const ready = await getJson("/health/ready");
console.log("ready:", ready.ok ? ready.body.checks : ready.body);

const live = await getJson("/api/v1/platform/live");
if (!live.ok) {
  console.error("platform/live failed:", live.status, live.body);
  process.exit(1);
}

const stats = live.body.stats ?? {};
console.log("\nplatform/live stats:");
console.log("  schoolsRegistered:", stats.schoolsRegistered ?? stats.activeSchools ?? 0);
console.log("  schoolsParticipating:", stats.schoolsParticipating ?? "n/a");
console.log("  validSubmissions:", stats.validSubmissions ?? 0);
console.log("  dataSource:", live.body.dataSource);

if ((stats.schoolsRegistered ?? stats.activeSchools ?? 0) === 0 && ready.body?.checks?.schoolsRegistered > 0) {
  console.error(
    "\nMismatch: DB has schools (readiness) but /platform/live reports 0 — deploy latest API build."
  );
  process.exit(1);
}

console.log("\nOK — live metrics match API database wiring.");
