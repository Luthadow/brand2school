import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../lib/logger.js";

const FAILED_MIGRATION = "20260521180000_commercial_workflow_expiry";
const apiRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

function run(cmd: string, { allowFail = false }: { allowFail?: boolean } = {}): boolean {
  try {
    execSync(cmd, { stdio: "inherit", cwd: apiRoot, env: process.env });
    return true;
  } catch {
    if (allowFail) return false;
    throw new Error(`Command failed: ${cmd}`);
  }
}

/** Apply pending Prisma migrations before serving traffic (production safety net). */
export function runPendingMigrations(): void {
  if (process.env.SKIP_MIGRATE_ON_START === "true") {
    logger.info("SKIP_MIGRATE_ON_START=true — skipping migrate deploy");
    return;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    logger.warn("DATABASE_URL missing — skipping migrate deploy on startup");
    return;
  }

  logger.info("Running prisma migrate deploy on startup");

  if (run(`npx prisma migrate resolve --rolled-back ${FAILED_MIGRATION}`, { allowFail: true })) {
    logger.info({ migration: FAILED_MIGRATION }, "Resolved rolled-back migration");
  }

  run("npx prisma migrate deploy");
  logger.info("Prisma migrations applied");
}
