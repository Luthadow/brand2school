import bcrypt from "bcryptjs";
import type { PrismaClient } from "../generated/prisma/index.js";

export const BOOTSTRAP_SUPER_ADMIN_EMAIL = "superadmin@brand2school.co.za";

/** Default password for local `db:seed` only — set BOOTSTRAP_SUPERADMIN_PASSWORD in production. */
export const BOOTSTRAP_DEFAULT_PASSWORD = "ChangeMe123!";

export async function bootstrapSuperAdmin(
  prisma: PrismaClient,
  password: string = BOOTSTRAP_DEFAULT_PASSWORD
): Promise<{ email: string; created: boolean }> {
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({
    where: { email: BOOTSTRAP_SUPER_ADMIN_EMAIL }
  });

  if (existing) {
    await prisma.user.update({
      where: { email: BOOTSTRAP_SUPER_ADMIN_EMAIL },
      data: { passwordHash, role: "SUPER_ADMIN", status: "ACTIVE" }
    });
    return { email: BOOTSTRAP_SUPER_ADMIN_EMAIL, created: false };
  }

  await prisma.user.create({
    data: {
      fullName: "Super Admin",
      email: BOOTSTRAP_SUPER_ADMIN_EMAIL,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE"
    }
  });

  return { email: BOOTSTRAP_SUPER_ADMIN_EMAIL, created: true };
}
