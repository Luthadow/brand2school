/**
 * Copy SMTP (and optional) vars from apps/api/.env into Railway API service.
 * Requires: railway login + linked project (railway link).
 *
 *   npm run railway:sync-env
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, "apps/api/.env");

const KEYS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "MAIL_FROM"
];

function parseEnvFile(path) {
  const out = {};
  if (!existsSync(path)) {
    console.error(`Missing ${path}`);
    process.exit(1);
  }
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = parseEnvFile(envPath);
const service = process.env.RAILWAY_SERVICE ?? "brand2school";

let set = 0;
for (const key of KEYS) {
  const value = env[key];
  if (!value) {
    console.warn(`Skip ${key} (not in apps/api/.env)`);
    continue;
  }
  console.log(`Set ${key} on Railway service "${service}"…`);
  execSync(`npx --yes @railway/cli@latest variable set ${key} --stdin --service ${service}`, {
    cwd: root,
    stdio: ["pipe", "inherit", "inherit"],
    input: value
  });
  set += 1;
}

console.log(`\nDone. ${set} variable(s) updated on "${service}". Railway will redeploy the API.`);
