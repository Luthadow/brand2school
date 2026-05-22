import { PrismaClient } from "../src/generated/prisma/index.js";
import { DEMO_LOGINS, DEMO_PASSWORD, runDemoSeed } from "../src/bootstrap/demoSeed.js";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await runDemoSeed(prisma);

  console.log("\nBrand2School demo accounts seeded.\n");
  console.log(`Password for all demo users: ${DEMO_PASSWORD}`);
  console.log("(Change after first login in production.)\n");

  for (const row of Object.values(DEMO_LOGINS)) {
    console.log(`${row.portal} portal`);
    console.log(`  URL:      ${row.url}`);
    console.log(`  Email:    ${row.email}`);
    if ("schoolCode" in row) console.log(`  School:   ${row.schoolCode}`);
    if ("brand" in row) console.log(`  Brand:    ${row.brand}`);
    console.log("");
  }

  console.log("Local dev URLs:");
  console.log("  Admin:  http://localhost:3001/login");
  console.log("  School: http://localhost:3000/school/login");
  console.log("  Brand:  http://localhost:3000/brand/login\n");
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
