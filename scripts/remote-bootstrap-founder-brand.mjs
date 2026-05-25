/**
 * Provision R2kay Liquid Freeze on remote API (Railway production).
 *
 * Usage:
 *   B2S_API_URL=https://api.brand2school.co.za \
 *   B2S_INTERNAL_API_KEY=your_key \
 *   FOUNDER_BRAND_ADMIN_EMAIL=you@example.com \
 *   node scripts/remote-bootstrap-founder-brand.mjs
 */

const apiBase = (process.env.B2S_API_URL ?? "https://api.brand2school.co.za").replace(/\/$/, "");
const internalKey = process.env.B2S_INTERNAL_API_KEY ?? process.env.INTERNAL_API_KEY;

if (!internalKey) {
  console.error("Set B2S_INTERNAL_API_KEY (same as API INTERNAL_API_KEY on Railway).");
  process.exit(1);
}

const body = {
  adminEmail: process.env.FOUNDER_BRAND_ADMIN_EMAIL ?? "siphokwape@gmail.com",
  adminPassword: process.env.FOUNDER_BRAND_ADMIN_PASSWORD,
  adminFullName: process.env.FOUNDER_BRAND_ADMIN_NAME,
  contactPhone: process.env.FOUNDER_BRAND_CONTACT_PHONE ?? "0824143232"
};

const res = await fetch(`${apiBase}/api/v1/platform/bootstrap-founder-brand`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-b2s-internal-key": internalKey
  },
  body: JSON.stringify(body)
});

const data = await res.json().catch(() => ({}));

if (!res.ok) {
  console.error(`Bootstrap failed (${res.status}):`, data.message ?? data);
  process.exit(1);
}

console.log("R2kay Liquid Freeze founder brand provisioned.\n");
console.log(JSON.stringify(data, null, 2));
