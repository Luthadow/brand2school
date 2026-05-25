import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import {
  bootstrapFounderBrand,
  FOUNDER_BRAND_ADMIN_EMAIL_DEFAULT,
  FOUNDER_BRAND_SLUG
} from "./bootstrapFounderBrand.js";

/** Create R2kay founder brand + BRAND_ADMIN user when missing (does not reset password if already linked). */
export async function ensureFounderBrandIfMissing(): Promise<void> {
  try {
    const adminEmail = (
      process.env.FOUNDER_BRAND_ADMIN_EMAIL ?? FOUNDER_BRAND_ADMIN_EMAIL_DEFAULT
    )
      .trim()
      .toLowerCase();

    const brand = await prisma.brand.findFirst({
      where: { slug: FOUNDER_BRAND_SLUG },
      select: { id: true }
    });

    const user = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true, role: true, brandId: true }
    });

    if (brand && user?.role === "BRAND_ADMIN" && user.brandId === brand.id) {
      return;
    }

    const adminPassword = process.env.FOUNDER_BRAND_ADMIN_PASSWORD ?? "ChangeMe123!";
    const result = await bootstrapFounderBrand(prisma, {
      adminEmail,
      adminPassword,
      adminFullName: process.env.FOUNDER_BRAND_ADMIN_NAME ?? "R2kay Brand Admin",
      contactPhone: process.env.FOUNDER_BRAND_CONTACT_PHONE ?? "0824143232"
    });

    logger.info(
      {
        brandId: result.brandId,
        brandAdminEmail: result.brandAdminEmail,
        brandAdminCreated: result.brandAdminCreated,
        created: result.created
      },
      "R2kay founder brand ensured on startup"
    );
  } catch (err) {
    logger.error({ err }, "Founder brand bootstrap failed");
  }
}
