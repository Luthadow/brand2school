import dotenv from "dotenv";
import { PrismaClient } from "../src/generated/prisma/index.js";
import {
  bootstrapMagomeBrand,
  MAGOME_BRAND_ADMIN_EMAIL_DEFAULT,
  MAGOME_BRAND_NAME
} from "../src/bootstrap/bootstrapMagomeBrand.js";

dotenv.config();

const adminEmail =
  process.env.MAGOME_BRAND_ADMIN_EMAIL ?? process.argv[2] ?? MAGOME_BRAND_ADMIN_EMAIL_DEFAULT;
const adminPassword = process.env.MAGOME_BRAND_ADMIN_PASSWORD ?? process.argv[3];
const contactPhone = process.env.MAGOME_BRAND_CONTACT_PHONE;

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const result = await bootstrapMagomeBrand(prisma, {
    adminEmail: adminEmail?.trim() || undefined,
    adminPassword: adminPassword || undefined,
    adminFullName: process.env.MAGOME_BRAND_ADMIN_NAME ?? "Ashley Speelman",
    contactPhone: contactPhone || undefined
  });

  console.log(`\n${MAGOME_BRAND_NAME} — founding partner brand ready.\n`);
  console.log(JSON.stringify(result, null, 2));
  console.log("\nPublic profile: /partners/magome-bakery-eatery");
  console.log("Campaign: Magome Bakery & Eatery × Brand2School");
  console.log(`Partnership ends: ${result.subscriptionEndDate}`);
  if (!result.logoUploaded) {
    console.warn("Logo not uploaded — check apps/api/assets/brands/magome-bakery-eatery.png or upload in admin.");
  }
  if (result.brandAdminEmail) {
    console.log(`Brand portal login: ${result.brandAdminEmail}`);
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
