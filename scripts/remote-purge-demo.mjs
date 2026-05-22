/**
 * Remove demo school/brand/campaign from remote API database (e.g. Railway production).
 *
 * Usage:
 *   B2S_API_URL=https://api.brand2school.co.za \
 *   B2S_INTERNAL_API_KEY=your_internal_key \
 *   node scripts/remote-purge-demo.mjs
 */

const apiBase = (process.env.B2S_API_URL ?? "https://api.brand2school.co.za").replace(/\/$/, "");
const internalKey = process.env.B2S_INTERNAL_API_KEY ?? process.env.INTERNAL_API_KEY;

if (!internalKey) {
  console.error("Set B2S_INTERNAL_API_KEY (same value as API INTERNAL_API_KEY on Railway).");
  process.exit(1);
}

const url = `${apiBase}/api/v1/platform/purge-demo-data`;

const res = await fetch(url, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-b2s-internal-key": internalKey
  }
});

const body = await res.json().catch(() => ({}));

if (!res.ok) {
  console.error(`Purge failed (${res.status}):`, body.message ?? body);
  process.exit(1);
}

console.log("Demo data removed from production.\n");
console.log(JSON.stringify(body, null, 2));
