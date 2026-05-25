import bcrypt from "bcryptjs";
import type { PrismaClient } from "../generated/prisma/index.js";
import { initBrandSubscriptionFromScope } from "../modules/commercial/brandSubscription.js";
import { computeGracePeriodEndsAt } from "../modules/commercial/campaignExpiry.js";
import {
  buildPartnershipLabel,
  computeLicenseEndsAt,
  LICENSE_TERM_MONTHS_DEFAULT
} from "../modules/commercial/transformationLicense.js";
import { syncCampaignCommercialStatus } from "../modules/commercial/campaignActivation.js";
import { ensureBrandVerificationCode } from "../lib/brandVerificationCode.js";

/** Flagship founder water brand — R2kay Liquid Freeze */
export const FOUNDER_BRAND_NAME = "R2kay Liquid Freeze";
export const FOUNDER_BRAND_SLUG = "r2kay-liquid-freeze";
export const FOUNDER_BRAND_CODE_PREFIX = "R2KAY";
/** Brand portal login for the founder water brand. */
export const FOUNDER_BRAND_ADMIN_EMAIL_DEFAULT = "siphokwape@gmail.com";

const FOUNDER_DESCRIPTION =
  "R2kay Liquid Freeze is a premium purified water brand delivering clean, refreshing, ice-cold hydration to schools, retailers, events, taxi ranks, and communities across South Africa. Purity, freshness, reliability, and modern street-market excellence.";

const FOUNDER_PRODUCTS =
  "Premium Purified Drinking Water — 500ml bottle (future: 330ml, 1L, 2L, sparkling & flavoured).";

const FOUNDER_CAMPAIGN_INTENTION =
  "Ice-cold hydration for schools, spaza shops, taxi ranks, events, gyms, restaurants, and retailers — launching from Rustenburg, North West.";

const FOUNDER_INTERNAL_NOTES =
  "Founder / platform launch partner — complimentary activation (no R10,000 setup fee). Lifetime founder pass.";

export type BootstrapFounderBrandInput = {
  adminEmail?: string;
  adminPassword?: string;
  adminFullName?: string;
  contactPhone?: string;
};

export type BootstrapFounderBrandResult = {
  brandId: string;
  slug: string;
  codePrefix: string;
  verificationCode: string;
  verificationStatus: string;
  campaignId: string | null;
  brandAdminEmail: string | null;
  brandAdminCreated: boolean;
  created: boolean;
};

export async function bootstrapFounderBrand(
  prisma: PrismaClient,
  input: BootstrapFounderBrandInput = {}
): Promise<BootstrapFounderBrandResult> {
  const adminEmail = (
    input.adminEmail ??
    process.env.FOUNDER_BRAND_ADMIN_EMAIL ??
    FOUNDER_BRAND_ADMIN_EMAIL_DEFAULT
  )
    .trim()
    .toLowerCase();
  const adminPassword = input.adminPassword ?? process.env.FOUNDER_BRAND_ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminFullName = input.adminFullName ?? "R2kay Brand Admin";
  const contactPhone = input.contactPhone ?? "0824143232";

  const existing = await prisma.brand.findFirst({
    where: {
      OR: [
        { slug: FOUNDER_BRAND_SLUG },
        { codePrefix: FOUNDER_BRAND_CODE_PREFIX },
        { name: { equals: FOUNDER_BRAND_NAME, mode: "insensitive" } }
      ]
    },
    include: { campaigns: { take: 1, orderBy: { createdAt: "desc" } }, users: { take: 1 } }
  });

  const subInit = initBrandSubscriptionFromScope("PROVINCIAL");
  const subscriptionEnd = new Date("2099-12-31T23:59:59.000Z");
  const subscriptionStart = new Date();

  const brandData = {
    name: FOUNDER_BRAND_NAME,
    legalName: FOUNDER_BRAND_NAME,
    codePrefix: FOUNDER_BRAND_CODE_PREFIX,
    slug: FOUNDER_BRAND_SLUG,
    status: "ACTIVE" as const,
    onboardingStatus: "COMMERCIALLY_ACTIVE" as const,
    registrationNumber: "FOUNDER-R2KAY",
    primaryContactEmail: adminEmail ?? null,
    contactPersons: adminEmail
      ? [
          {
            name: adminFullName,
            email: adminEmail,
            role: "Founder",
            phone: contactPhone
          }
        ]
      : undefined,
    intendedProvinces: ["North West", "Gauteng"],
    campaignIntention: FOUNDER_CAMPAIGN_INTENTION,
    productsInvolved: FOUNDER_PRODUCTS,
    internalReviewNotes: FOUNDER_INTERNAL_NOTES,
    description: FOUNDER_DESCRIPTION,
    brandColor: "#00A8E8",
    websiteUrl: null as string | null,
    featuredOnHome: true,
    publicProfileEnabled: true,
    homeSortOrder: 0,
    founderExempt: true,
    verificationStatus: "FOUNDER_VERIFIED" as const,
    verifiedAt: subscriptionStart,
    activationFeePaid: true,
    subscriptionStatus: "ACTIVE" as const,
    subscriptionPlan: subInit.subscriptionPlan,
    subscriptionStartDate: subscriptionStart,
    subscriptionEndDate: subscriptionEnd,
    recurringAmountZar: 0,
    billingCycle: subInit.billingCycle,
    verificationPolicy: { maxUsesPerCode: 1 }
  };

  let brandId: string;
  let created = false;
  let campaignId: string | null = null;

  if (existing) {
    const updated = await prisma.brand.update({
      where: { id: existing.id },
      data: brandData
    });
    brandId = updated.id;
    campaignId = existing.campaigns[0]?.id ?? null;
  } else {
    const brand = await prisma.brand.create({ data: brandData });
    brandId = brand.id;
    created = true;
  }

  const agreement = await prisma.brandAgreement.findFirst({
    where: { brandId },
    orderBy: { version: "desc" }
  });

  if (!agreement) {
    await prisma.brandAgreement.create({
      data: {
        brandId,
        version: 1,
        status: "APPROVED",
        approvedAt: new Date(),
        scopeSnapshot: {
          founderPass: true,
          productsInvolved: FOUNDER_PRODUCTS,
          intendedProvinces: ["North West", "Gauteng"]
        }
      }
    });
  } else if (agreement.status !== "APPROVED") {
    await prisma.brandAgreement.update({
      where: { id: agreement.id },
      data: { status: "APPROVED", approvedAt: new Date() }
    });
  }

  if (!campaignId) {
    const startsAt = new Date();
    const licenseTermMonths = LICENSE_TERM_MONTHS_DEFAULT;
    const endsAt = computeLicenseEndsAt(startsAt, licenseTermMonths);
    const campaignSlug = `${FOUNDER_BRAND_SLUG}-north-west`.slice(0, 48);
    const campaign = await prisma.campaign.create({
      data: {
        brandId,
        name: "R2kay Liquid Freeze — North West Hydration",
        slug: campaignSlug,
        campaignCode: "NW26",
        category: "Water & Hydration",
        infrastructureGoal: "Water",
        startsAt,
        endsAt,
        licenseTermMonths,
        partnershipLabel: buildPartnershipLabel({
          brandName: FOUNDER_BRAND_NAME,
          provinceOrTerritory: "North West",
          scopeType: "PROVINCIAL"
        }),
        sponsorshipTrack: "FULL_TERRITORY",
        gracePeriodEndsAt: computeGracePeriodEndsAt({ endsAt, gracePeriodDays: 14 }),
        isActive: false,
        scopeType: "PROVINCIAL",
        allowedProvinces: ["North West"],
        setupFeeZar: 0,
        paymentVerifiedAt: new Date(),
        rulesConfiguredAt: new Date(),
        commercialStatus: "READY_FOR_APPROVAL",
        targetSubmissions: 5000
      }
    });
    campaignId = campaign.id;
  } else {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        setupFeeZar: 0,
        paymentVerifiedAt: new Date(),
        rulesConfiguredAt: new Date(),
        category: "Water & Hydration",
        infrastructureGoal: "Water"
      }
    });
  }

  if (campaignId) {
    await syncCampaignCommercialStatus(campaignId);
  }

  let brandAdminCreated = false;
  let brandAdminEmail: string | null = null;

  if (adminEmail) {
    brandAdminEmail = adminEmail;
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const user = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (user) {
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          fullName: adminFullName,
          passwordHash,
          role: "BRAND_ADMIN",
          status: "ACTIVE",
          brandId
        }
      });
    } else {
      await prisma.user.create({
        data: {
          fullName: adminFullName,
          email: adminEmail,
          passwordHash,
          role: "BRAND_ADMIN",
          status: "ACTIVE",
          brandId
        }
      });
      brandAdminCreated = true;
    }
  }

  const verificationCode = await ensureBrandVerificationCode(
    prisma,
    brandId,
    FOUNDER_BRAND_CODE_PREFIX
  );

  await prisma.brand.update({
    where: { id: brandId },
    data: {
      verificationStatus: "FOUNDER_VERIFIED",
      verifiedAt: subscriptionStart
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "FOUNDER_BRAND_BOOTSTRAPPED",
      targetType: "Brand",
      targetId: brandId,
      payload: {
        slug: FOUNDER_BRAND_SLUG,
        verificationCode,
        founderExempt: true,
        homeSortOrder: 0,
        campaignId,
        brandAdminEmail
      }
    }
  });

  return {
    brandId,
    slug: FOUNDER_BRAND_SLUG,
    codePrefix: FOUNDER_BRAND_CODE_PREFIX,
    verificationCode,
    verificationStatus: "FOUNDER_VERIFIED",
    campaignId,
    brandAdminEmail,
    brandAdminCreated,
    created
  };
}
