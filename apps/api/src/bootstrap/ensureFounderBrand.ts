import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { ensureFounderCampaignParticipationReady } from "./activateFounderCampaign.js";
import {
  bootstrapFounderBrand,
  FOUNDER_BRAND_ADMIN_EMAIL_DEFAULT,
  FOUNDER_BRAND_SLUG
} from "./bootstrapFounderBrand.js";

/** Create R2kay founder brand + live campaign for /submit (runs on every API startup). */
export async function ensureFounderBrandIfMissing(): Promise<void> {
  try {
    const adminEmail = (
      process.env.FOUNDER_BRAND_ADMIN_EMAIL ?? FOUNDER_BRAND_ADMIN_EMAIL_DEFAULT
    )
      .trim()
      .toLowerCase();

    let brand = await prisma.brand.findFirst({
      where: { slug: FOUNDER_BRAND_SLUG },
      include: { campaigns: { select: { id: true } } }
    });

    const user = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true, role: true, brandId: true }
    });

    const needsBootstrap =
      !brand || !(user?.role === "BRAND_ADMIN" && user.brandId === brand.id);

    if (needsBootstrap) {
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

      return;
    }

    brand = await prisma.brand.findFirst({
      where: { slug: FOUNDER_BRAND_SLUG },
      include: { campaigns: { select: { id: true } } }
    });

    if (!brand) return;

    for (const campaign of brand.campaigns) {
      const live = await ensureFounderCampaignParticipationReady(prisma, brand.id, campaign.id);
      if (live.activated) {
        logger.info(
          { brandId: brand.id, campaignId: campaign.id, codesSeeded: live.codesSeeded },
          "Founder campaign activated for public participation"
        );
      }
    }
  } catch (err) {
    logger.error({ err }, "Founder brand bootstrap failed");
  }
}
