import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { runDemoSeed } from "./demoSeed.js";

/** Idempotent: ensure demo super admin (and baseline brands) exist when platform has no SUPER_ADMIN. */
export async function ensureDemoSeedIfMissing(): Promise<void> {
  try {
    const superAdminCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superAdminCount > 0) return;

    const summary = await runDemoSeed(prisma);
    logger.info({ summary }, "Demo seed applied automatically (no SUPER_ADMIN in database)");
  } catch (err) {
    logger.error({ err }, "Automatic demo seed failed");
  }
}
