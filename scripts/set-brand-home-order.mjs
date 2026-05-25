/**
 * Set a brand's homepage sort order (lower = first on homepage / partners).
 *
 * Usage:
 *   node scripts/set-brand-home-order.mjs "R2kay LiquiFreeze" 0
 *   BRAND_NAME="R2kay LiquiFreeze" HOME_SORT_ORDER=0 node scripts/set-brand-home-order.mjs
 */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "../apps/api/src/generated/prisma/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, "apps/api/.env") });

const brandName = process.env.BRAND_NAME ?? process.argv[2];
const homeSortOrder = Number(process.env.HOME_SORT_ORDER ?? process.argv[3] ?? "0");

if (!brandName?.trim()) {
  console.error("Usage: node scripts/set-brand-home-order.mjs \"Brand Name\" [order]");
  console.error("  order defaults to 0 (first).");
  process.exit(1);
}

if (!Number.isInteger(homeSortOrder) || homeSortOrder < 0) {
  console.error("Home sort order must be a non-negative integer.");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  let matches = await prisma.brand.findMany({
    where: { name: { equals: brandName.trim(), mode: "insensitive" } },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      homeSortOrder: true,
      featuredOnHome: true,
      logoUrl: true
    }
  });

  if (matches.length === 0 && /r2kay/i.test(brandName)) {
    matches = await prisma.brand.findMany({
      where: { name: { contains: "r2kay", mode: "insensitive" } },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        homeSortOrder: true,
        featuredOnHome: true,
        logoUrl: true
      }
    });
  }

  if (matches.length === 0) {
    const fuzzy = await prisma.brand.findMany({
      where: { name: { contains: brandName.trim(), mode: "insensitive" } },
      select: { id: true, name: true, slug: true, status: true, homeSortOrder: true },
      take: 10
    });
    console.error(`No brand found with name "${brandName}".`);
    if (fuzzy.length > 0) {
      console.error("Similar names:");
      for (const b of fuzzy) console.error(`  - ${b.name} (${b.slug}, ${b.status}, order=${b.homeSortOrder})`);
    }
    process.exit(1);
  }

  if (matches.length > 1) {
    console.error(`Multiple brands match "${brandName}":`);
    for (const b of matches) console.error(`  - ${b.id} ${b.name}`);
    process.exit(1);
  }

  const brand = matches[0];
  const updated = await prisma.brand.update({
    where: { id: brand.id },
    data: { homeSortOrder }
  });

  console.log(`Updated ${updated.name}:`);
  console.log(`  slug:           ${updated.slug}`);
  console.log(`  status:         ${brand.status}`);
  console.log(`  homeSortOrder:  ${brand.homeSortOrder} → ${updated.homeSortOrder}`);

  if (brand.status !== "ACTIVE") {
    console.warn("\nNote: Brand is not ACTIVE — approve it in admin before it appears publicly.");
  }
  if (!brand.logoUrl) {
    console.warn("Note: No logo uploaded — upload one before featuring on homepage.");
  }
  if (!brand.featuredOnHome) {
    console.warn("Note: Not featured on homepage — enable in admin → Brands for the logo strip.");
  }
} finally {
  await prisma.$disconnect();
}
