import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { hasBrandLogo } from "../lib/brandLogo.js";
import { ensureFounderCampaignParticipationReady } from "./activateFounderCampaign.js";
import {
  applyMagomeLogo,
  bootstrapMagomeBrand,
  MAGOME_BRAND_ADMIN_EMAIL_DEFAULT,
  MAGOME_BRAND_SLUG
} from "./bootstrapMagomeBrand.js";

/** Create Magome founding partner brand + live campaign for /submit (runs on every API startup). */
export async function ensureMagomeBrandIfMissing(): Promise<void> {
  try {
    const adminEmail = (
      process.env.MAGOME_BRAND_ADMIN_EMAIL ?? MAGOME_BRAND_ADMIN_EMAIL_DEFAULT
    )
      .trim()
      .toLowerCase();

    let brand = await prisma.brand.findFirst({
      where: { slug: MAGOME_BRAND_SLUG },
      include: { campaigns: { select: { id: true } } }
    });

    const user = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true, role: true, brandId: true }
    });

    const needsBootstrap =
      !brand || !(user?.role === "BRAND_ADMIN" && user.brandId === brand.id);

    if (needsBootstrap) {
      const adminPassword = process.env.MAGOME_BRAND_ADMIN_PASSWORD ?? "ChangeMe123!";
      const result = await bootstrapMagomeBrand(prisma, {
        adminEmail,
        adminPassword,
        adminFullName: process.env.MAGOME_BRAND_ADMIN_NAME ?? "Ashley Speelman",
        contactPhone: process.env.MAGOME_BRAND_CONTACT_PHONE
      });

      logger.info(
        {
          brandId: result.brandId,
          brandAdminEmail: result.brandAdminEmail,
          brandAdminCreated: result.brandAdminCreated,
          created: result.created,
          logoUploaded: result.logoUploaded,
          subscriptionEndDate: result.subscriptionEndDate
        },
        "Magome founding partner brand ensured on startup"
      );

      return;
    }

    brand = await prisma.brand.findFirst({
      where: { slug: MAGOME_BRAND_SLUG },
      include: { campaigns: { select: { id: true } } }
    });

    if (!brand) return;

    // Homepage "Verified partners" requires ACTIVE + featuredOnHome + logoUrl.
    const needsLogo = !hasBrandLogo(brand.logoUrl) || !brand.featuredOnHome || brand.status !== "ACTIVE";
    if (needsLogo) {
      const logoUploaded = await applyMagomeLogo(prisma, brand.id);
      if (logoUploaded) {
        logger.info({ brandId: brand.id }, "Magome logo repaired for verified partners strip");
      } else if (!brand.featuredOnHome || brand.status !== "ACTIVE") {
        await prisma.brand.update({
          where: { id: brand.id },
          data: {
            ...(hasBrandLogo(brand.logoUrl) ? { featuredOnHome: true, publicProfileEnabled: true } : {}),
            status: "ACTIVE"
          }
        });
      }
    }

    for (const campaign of brand.campaigns) {
      const live = await ensureFounderCampaignParticipationReady(prisma, brand.id, campaign.id);
      if (live.activated) {
        logger.info(
          { brandId: brand.id, campaignId: campaign.id, codesSeeded: live.codesSeeded },
          "Magome campaign activated for public participation"
        );
      }
    }
  } catch (err) {
    logger.error({ err }, "Magome founding partner bootstrap failed");
  }
}
