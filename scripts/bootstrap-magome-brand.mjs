/**
 * Local: provision Magome Bakery & Eatery founding partner (requires DATABASE_URL + migrations).
 *
 *   MAGOME_BRAND_ADMIN_EMAIL=ashleyshimrora21@gmail.com npm run brand:bootstrap-magome
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = path.join(root, "apps", "api");

const result = spawnSync("npx", ["tsx", "scripts/bootstrap-magome-brand-cli.ts", ...process.argv.slice(2)], {
  cwd: apiDir,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env
});

process.exit(result.status ?? 1);
