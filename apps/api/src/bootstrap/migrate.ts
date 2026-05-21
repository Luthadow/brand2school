import { execSync } from "node:child_process";
import { logger } from "../lib/logger.js";

export function runDatabaseMigrations(): void {
  try {
    logger.info("Applying database migrations (prisma migrate deploy)...");
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: process.env
    });
    logger.info("Database migrations applied.");
  } catch (error) {
    logger.error({ err: error }, "Database migration failed.");
    throw error;
  }
}
