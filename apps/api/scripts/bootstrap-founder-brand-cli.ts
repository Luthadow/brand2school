import dotenv from "dotenv";
import { PrismaClient } from "../src/generated/prisma/index.js";
import {
  bootstrapFounderBrand,
  FOUNDER_BRAND_ADMIN_EMAIL_DEFAULT,
  FOUNDER_BRAND_NAME
} from "../src/bootstrap/bootstrapFounderBrand.js";

dotenv.config();

const adminEmail =
  process.env.FOUNDER_BRAND_ADMIN_EMAIL ?? process.argv[2] ?? FOUNDER_BRAND_ADMIN_EMAIL_DEFAULT;
const adminPassword = process.env.FOUNDER_BRAND_ADMIN_PASSWORD ?? process.argv[3];
const contactPhone = process.env.FOUNDER_BRAND_CONTACT_PHONE ?? "0824143232";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const result = await bootstrapFounderBrand(prisma, {
    adminEmail: adminEmail?.trim() || undefined,
    adminPassword: adminPassword || undefined,
    contactPhone
  });

  console.log(`\n${FOUNDER_BRAND_NAME} — founder brand ready.\n`);
  console.log(JSON.stringify(result, null, 2));
  console.log("\nPublic profile: /partners/r2kay-liquid-freeze");
  console.log("Upload logo in admin → Brands for the homepage strip.");
  if (result.brandAdminEmail) {
    console.log(`Brand portal login: ${result.brandAdminEmail}`);
  } else {
    console.warn("\nSet FOUNDER_BRAND_ADMIN_EMAIL to create a BRAND_ADMIN user.");
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
