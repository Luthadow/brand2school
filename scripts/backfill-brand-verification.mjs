/**
 * Align brand verification codes + trust status for all brands (Railway or local).
 *
 *   B2S_INTERNAL_API_KEY=... B2S_API_URL=https://api.brand2school.co.za node scripts/backfill-brand-verification.mjs
 */
const apiBase = (process.env.B2S_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const key = process.env.B2S_INTERNAL_API_KEY ?? process.env.INTERNAL_API_KEY;

if (!key) {
  console.error("Set B2S_INTERNAL_API_KEY (or INTERNAL_API_KEY).");
  process.exit(1);
}

const res = await fetch(`${apiBase}/api/v1/platform/backfill-brand-verification`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-internal-api-key": key
  }
});

const body = await res.json().catch(() => ({}));
console.log(res.status, body);
if (!res.ok) process.exit(1);
