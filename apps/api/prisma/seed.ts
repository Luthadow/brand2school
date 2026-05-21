import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

/**
 * Minimal seed: platform super admin only.
 * Schools, brands, campaigns, and codes are created through registration and admin flows.
 */
async function main(): Promise<void> {
  const adminPassword = await bcrypt.hash("ChangeMe123!", 10);

  await prisma.user.upsert({
    where: { email: "superadmin@brand2school.co.za" },
    update: {},
    create: {
      fullName: "Super Admin",
      email: "superadmin@brand2school.co.za",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
