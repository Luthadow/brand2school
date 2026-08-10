/**
 * Provision Magome Bakery & Eatery on remote API (Railway production).
 *
 * Usage:
 *   B2S_API_URL=https://api.brand2school.co.za \
 *   B2S_INTERNAL_API_KEY=your_key \
 *   MAGOME_BRAND_ADMIN_EMAIL=ashleyshimrora21@gmail.com \
 *   node scripts/remote-bootstrap-magome-brand.mjs
 */

const apiBase = (process.env.B2S_API_URL ?? "https://api.brand2school.co.za").replace(/\/$/, "");
const internalKey = process.env.B2S_INTERNAL_API_KEY ?? process.env.INTERNAL_API_KEY;

if (!internalKey) {
  console.error("Set B2S_INTERNAL_API_KEY (same as API INTERNAL_API_KEY on Railway).");
  process.exit(1);
}

const body = {
  adminEmail: process.env.MAGOME_BRAND_ADMIN_EMAIL ?? "ashleyshimrora21@gmail.com",
  adminPassword: process.env.MAGOME_BRAND_ADMIN_PASSWORD,
  adminFullName: process.env.MAGOME_BRAND_ADMIN_NAME ?? "Ashley Speelman",
  contactPhone: process.env.MAGOME_BRAND_CONTACT_PHONE
};

const res = await fetch(`${apiBase}/api/v1/platform/bootstrap-magome-brand`, {
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

console.log("Magome Bakery & Eatery founding partner provisioned.\n");
console.log(JSON.stringify(data, null, 2));
