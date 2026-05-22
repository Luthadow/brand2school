import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { bootstrapSuperAdmin, BOOTSTRAP_DEFAULT_PASSWORD } from "./bootstrapSuperAdmin.js";
import { purgeDemoData } from "./purgeDemoData.js";

/** Remove legacy demo rows and ensure a SUPER_ADMIN exists on boot. */
export async function ensureSuperAdminIfMissing(): Promise<void> {
  try {
    const purged = await purgeDemoData(prisma);
    if (purged.removedSchoolId || purged.removedBrandId || purged.removedUsers.length > 0) {
      logger.info({ purged }, "Removed demo school/brand data");
    }

    const superAdminCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superAdminCount > 0) return;

    const password = process.env.BOOTSTRAP_SUPERADMIN_PASSWORD?.trim() || BOOTSTRAP_DEFAULT_PASSWORD;
    const result = await bootstrapSuperAdmin(prisma, password);
    logger.info({ result }, "Super admin bootstrapped");
  } catch (err) {
    logger.error({ err }, "Super admin bootstrap failed");
  }
}
