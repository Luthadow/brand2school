import type { PrismaClient } from "../generated/prisma/index.js";

export const DEMO_SCHOOL_CODE = "LANGA-DEMO-GP";
export const DEMO_SCHOOL_EMAIL = "demo.school@brand2school.co.za";
export const DEMO_BRAND_CODE_PREFIX = "DEMO";
export const DEMO_BRAND_SLUG = "demo-beverage-partner";
export const DEMO_BRAND_EMAIL = "demo.brand@brand2school.co.za";
export const DEMO_CAMPAIGN_SLUG = "demo-back-to-school";

export type PurgeDemoSummary = {
  removedUsers: string[];
  removedSchoolId: string | null;
  removedBrandId: string | null;
  removedCampaignSlugs: string[];
};

/** Removes seeded demo school, brand, campaign, and portal users. Keeps superadmin@. */
export async function purgeDemoData(prisma: PrismaClient): Promise<PurgeDemoSummary> {
  const summary: PurgeDemoSummary = {
    removedUsers: [],
    removedSchoolId: null,
    removedBrandId: null,
    removedCampaignSlugs: []
  };

  const demoUserEmails = [DEMO_SCHOOL_EMAIL, DEMO_BRAND_EMAIL];
  for (const email of demoUserEmails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.delete({ where: { id: user.id } });
      summary.removedUsers.push(email);
    }
  }

  const school = await prisma.school.findUnique({ where: { schoolCode: DEMO_SCHOOL_CODE } });
  if (school) {
    await prisma.school.delete({ where: { id: school.id } });
    summary.removedSchoolId = school.id;
  }

  const brand = await prisma.brand.findFirst({
    where: { OR: [{ codePrefix: DEMO_BRAND_CODE_PREFIX }, { slug: DEMO_BRAND_SLUG }] }
  });
  if (brand) {
    const campaigns = await prisma.campaign.findMany({
      where: { brandId: brand.id },
      select: { slug: true }
    });
    summary.removedCampaignSlugs = campaigns.map((c) => c.slug);
    await prisma.brand.delete({ where: { id: brand.id } });
    summary.removedBrandId = brand.id;
  } else {
    const orphanCampaign = await prisma.campaign.findUnique({ where: { slug: DEMO_CAMPAIGN_SLUG } });
    if (orphanCampaign) {
      await prisma.campaign.delete({ where: { id: orphanCampaign.id } });
      summary.removedCampaignSlugs.push(DEMO_CAMPAIGN_SLUG);
    }
  }

  return summary;
}
