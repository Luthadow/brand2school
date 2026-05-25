/**
 * Verify production SMTP from your machine (uses API INTERNAL_API_KEY).
 *
 * Usage:
 *   B2S_API_URL=https://api.brand2school.co.za \
 *   B2S_INTERNAL_API_KEY=your_key \
 *   node scripts/remote-verify-smtp.mjs
 *
 * Send a test message:
 *   node scripts/remote-verify-smtp.mjs --send-to you@example.com
 */

const apiBase = (process.env.B2S_API_URL ?? "https://api.brand2school.co.za").replace(/\/$/, "");
const internalKey = process.env.B2S_INTERNAL_API_KEY ?? process.env.INTERNAL_API_KEY;

if (!internalKey) {
  console.error("Set B2S_INTERNAL_API_KEY (same as API INTERNAL_API_KEY on Railway).");
  process.exit(1);
}

const sendTo = process.argv.includes("--send-to")
  ? process.argv[process.argv.indexOf("--send-to") + 1]
  : undefined;

const res = await fetch(`${apiBase}/api/v1/platform/verify-smtp`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-b2s-internal-key": internalKey
  },
  body: JSON.stringify(sendTo ? { sendTo } : {})
});

const data = await res.json().catch(() => ({}));

if (!res.ok) {
  console.error(`SMTP verify failed (${res.status}):`, data.message ?? data.error ?? data);
  process.exit(1);
}

console.log(JSON.stringify(data, null, 2));

if (!data.verified) {
  process.exit(1);
}
