import { PrismaClient } from "../src/generated/prisma/index.js";
import {
  BOOTSTRAP_DEFAULT_PASSWORD,
  BOOTSTRAP_SUPER_ADMIN_EMAIL,
  bootstrapSuperAdmin
} from "../src/bootstrap/bootstrapSuperAdmin.js";
import { purgeDemoData } from "../src/bootstrap/purgeDemoData.js";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const purged = await purgeDemoData(prisma);
  if (purged.removedSchoolId || purged.removedBrandId || purged.removedUsers.length > 0) {
    console.log("Removed legacy demo records:", purged);
  }

  const result = await bootstrapSuperAdmin(prisma);
  console.log("\nBrand2School bootstrap complete.\n");
  console.log(`Super admin: ${BOOTSTRAP_SUPER_ADMIN_EMAIL}`);
  console.log(`Password:    ${BOOTSTRAP_DEFAULT_PASSWORD}`);
  console.log(`Account:     ${result.created ? "created" : "updated"}`);
  console.log("\nLocal admin: http://localhost:3001/login\n");
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
