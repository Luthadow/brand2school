import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const apiDir = join(dirname(fileURLToPath(import.meta.url)), "..", "apps", "api");
const FAILED_MIGRATION = "20260521180000_commercial_workflow_expiry";

function run(cmd, { allowFail = false } = {}) {
  try {
    execSync(cmd, { stdio: "inherit", cwd: apiDir, env: process.env });
    return true;
  } catch (error) {
    if (allowFail) return false;
    throw error;
  }
}

console.log("Railway pre-deploy: prisma migrate");

// Recover from P3009 if an earlier deploy failed on enum-in-transaction migration.
if (
  run(`npx prisma migrate resolve --rolled-back ${FAILED_MIGRATION}`, {
    allowFail: true
  })
) {
  console.log(`Resolved rolled-back: ${FAILED_MIGRATION}`);
} else {
  console.log(`Resolve skipped (not in failed state): ${FAILED_MIGRATION}`);
}

run("npx prisma migrate deploy");
console.log("Railway pre-deploy: migrations complete.");
