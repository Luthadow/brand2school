/**
 * Local: provision R2kay Liquid Freeze via Prisma (requires DATABASE_URL + migrations).
 *
 *   FOUNDER_BRAND_ADMIN_EMAIL=you@example.com npm run brand:bootstrap-founder
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = path.join(root, "apps", "api");

const result = spawnSync("npx", ["tsx", "scripts/bootstrap-founder-brand-cli.ts", ...process.argv.slice(2)], {
  cwd: apiDir,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env
});

process.exit(result.status ?? 1);
