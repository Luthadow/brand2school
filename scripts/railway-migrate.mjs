import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const apiDir = join(dirname(fileURLToPath(import.meta.url)), "..", "apps", "api");

function run(cmd) {
  execSync(cmd, { stdio: "inherit", cwd: apiDir, env: process.env });
}

// One-time recovery: earlier deploy failed on enum changes inside a single transaction (P3009).
try {
  run(
    "npx prisma migrate resolve --rolled-back 20260521180000_commercial_workflow_expiry"
  );
  console.log("Marked 20260521180000_commercial_workflow_expiry as rolled back.");
} catch {
  console.warn(
    "migrate resolve skipped (already resolved or not in failed state)."
  );
}

run("npx prisma migrate deploy");
