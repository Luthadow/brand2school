import { prisma } from "../../lib/prisma.js";
import { resolveLogoPublicUrl } from "../../lib/brandStorage.js";
import { getCampaignExpiryBlockReason } from "../commercial/campaignExpiry.js";

export type ParticipationBrandOption = {
  slug: string;
  name: string;
  codePrefix: string;
  logoUrl: string | null;
  campaigns: Array<{ slug: string; name: string }>;
};

/** ACTIVE brands with at least one live campaign (for web / WhatsApp selects). */
export async function listParticipationBrands(): Promise<ParticipationBrandOption[]> {
  const now = new Date();
  const brands = await prisma.brand.findMany({
    where: { status: "ACTIVE" },
    select: {
      slug: true,
      name: true,
      codePrefix: true,
      logoUrl: true,
      homeSortOrder: true,
      campaigns: {
        where: { isActive: true },
        select: {
          id: true,
          slug: true,
          name: true,
          startsAt: true,
          endsAt: true,
          isActive: true,
          autoSuspendOnExpiry: true,
          gracePeriodEndsAt: true,
          gracePeriodDays: true,
          expiredAt: true
        },
        orderBy: { name: "asc" }
      }
    },
    orderBy: [{ homeSortOrder: "asc" }, { name: "asc" }]
  });

  const options: ParticipationBrandOption[] = [];

  for (const brand of brands) {
    const live: Array<{ slug: string; name: string }> = [];
    for (const campaign of brand.campaigns) {
      const block = getCampaignExpiryBlockReason(campaign, now);
      if (block) continue;
      live.push({ slug: campaign.slug, name: campaign.name });
    }
    if (live.length === 0) continue;
    options.push({
      slug: brand.slug,
      name: brand.name,
      codePrefix: brand.codePrefix,
      logoUrl: resolveLogoPublicUrl(brand.logoUrl),
      campaigns: live
    });
  }

  return options;
}
