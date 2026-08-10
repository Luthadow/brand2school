import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "../generated/prisma/index.js";
import { saveBrandLogo } from "../lib/brandStorage.js";
import { ensureBrandVerificationCode } from "../lib/brandVerificationCode.js";
import { syncCampaignCommercialStatus } from "../modules/commercial/campaignActivation.js";
import { computeGracePeriodEndsAt } from "../modules/commercial/campaignExpiry.js";
import { buildPartnershipLabel, computeLicenseEndsAt } from "../modules/commercial/transformationLicense.js";
import { ensureFounderCampaignParticipationReady } from "./activateFounderCampaign.js";

/** Pilot founding restaurant partner — Magome Bakery & Eatery (Boitekong, Rustenburg). */
export const MAGOME_BRAND_NAME = "Magome Bakery & Eatery";
export const MAGOME_BRAND_SLUG = "magome-bakery-eatery";
export const MAGOME_BRAND_CODE_PREFIX = "MAGOME";
export const MAGOME_BRAND_ADMIN_EMAIL_DEFAULT = "ashleyshimrora21@gmail.com";
export const MAGOME_PARTNERSHIP_MONTHS = 6;
export const MAGOME_CAMPAIGN_TARGET = 1000;
export const MAGOME_HOME_SORT_ORDER = 1;

const MAGOME_DESCRIPTION =
  "Magome Bakery & Eatery is a Fast Food / Food & Beverage restaurant in Boitekong, Rustenburg. Founding Brand Partner — customers support school and community impact through verified Brand2School participation.";

const MAGOME_PRODUCTS =
  "Restaurant meals and takeaways — e.g. burger, chips, and drink combos with campaign participation codes.";

const MAGOME_CAMPAIGN_INTENTION =
  "Every Meal Can Make an Impact. Customers of Magome Bakery & Eatery participate in supporting a selected school/community initiative through their purchases.";

const MAGOME_INTERNAL_NOTES =
  "Founding Brand Partner pilot — 6-month platform fee waiver (R0). Prove journey: Restaurant → Customer → Participation → Verification → School → Impact → Reporting.";

export const MAGOME_LOGO_ASSET_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../assets/brands/magome-bakery-eatery.png"
);

/** Upload Magome logo + enable homepage strip when asset is present. */
export async function applyMagomeLogo(prisma: PrismaClient, brandId: string): Promise<boolean> {
  try {
    const buffer = await fs.readFile(MAGOME_LOGO_ASSET_PATH);
    const storedPath = await saveBrandLogo(brandId, {
      buffer,
      mimetype: "image/png",
      size: buffer.length
    });
    await prisma.brand.update({
      where: { id: brandId },
      data: {
        logoUrl: storedPath,
        logoPng: buffer,
        featuredOnHome: true,
        publicProfileEnabled: true,
        status: "ACTIVE"
      }
    });
    return true;
  } catch {
    return false;
  }
}

export type BootstrapMagomeBrandInput = {
  adminEmail?: string;
  adminPassword?: string;
  adminFullName?: string;
  contactPhone?: string;
  /** When true, skip logo file load (e.g. remote API without asset on disk). */
  skipLogo?: boolean;
};

export type BootstrapMagomeBrandResult = {
  brandId: string;
  slug: string;
  codePrefix: string;
  verificationCode: string;
  verificationStatus: string;
  campaignId: string | null;
  brandAdminEmail: string | null;
  brandAdminCreated: boolean;
  partnershipMonths: number;
  subscriptionEndDate: string;
  logoUploaded: boolean;
  created: boolean;
};

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export async function bootstrapMagomeBrand(
  prisma: PrismaClient,
  input: BootstrapMagomeBrandInput = {}
): Promise<BootstrapMagomeBrandResult> {
  const adminEmail = (
    input.adminEmail ??
    process.env.MAGOME_BRAND_ADMIN_EMAIL ??
    MAGOME_BRAND_ADMIN_EMAIL_DEFAULT
  )
    .trim()
    .toLowerCase();
  const adminPassword = input.adminPassword ?? process.env.MAGOME_BRAND_ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminFullName = input.adminFullName ?? "Ashley Speelman";
  const contactPhone = input.contactPhone ?? process.env.MAGOME_BRAND_CONTACT_PHONE ?? null;

  const existing = await prisma.brand.findFirst({
    where: {
      OR: [
        { slug: MAGOME_BRAND_SLUG },
        { codePrefix: MAGOME_BRAND_CODE_PREFIX },
        { name: { equals: MAGOME_BRAND_NAME, mode: "insensitive" } }
      ]
    },
    include: { campaigns: { take: 1, orderBy: { createdAt: "desc" } }, users: { take: 1 } }
  });

  const subscriptionStart = existing?.subscriptionStartDate ?? new Date();
  const subscriptionEnd = existing?.subscriptionEndDate ?? addMonths(subscriptionStart, MAGOME_PARTNERSHIP_MONTHS);

  const brandData = {
    name: MAGOME_BRAND_NAME,
    legalName: MAGOME_BRAND_NAME,
    codePrefix: MAGOME_BRAND_CODE_PREFIX,
    slug: MAGOME_BRAND_SLUG,
    status: "ACTIVE" as const,
    onboardingStatus: "COMMERCIALLY_ACTIVE" as const,
    registrationNumber: "FOUNDING-MAGOME",
    primaryContactEmail: adminEmail ?? null,
    contactPersons: adminEmail
      ? [
          {
            name: adminFullName,
            email: adminEmail,
            role: "Founding Partner Contact",
            phone: contactPhone,
            location: "Boitekong, Rustenburg"
          }
        ]
      : undefined,
    intendedProvinces: ["North West"],
    campaignIntention: MAGOME_CAMPAIGN_INTENTION,
    productsInvolved: MAGOME_PRODUCTS,
    internalReviewNotes: MAGOME_INTERNAL_NOTES,
    description: MAGOME_DESCRIPTION,
    brandColor: "#F15A29",
    websiteUrl: null as string | null,
    featuredOnHome: true,
    publicProfileEnabled: true,
    homeSortOrder: MAGOME_HOME_SORT_ORDER,
    founderExempt: true,
    verificationStatus: "FOUNDER_VERIFIED" as const,
    verifiedAt: subscriptionStart,
    activationFeePaid: true,
    subscriptionStatus: "ACTIVE" as const,
    subscriptionPlan: "SCHOOL" as const,
    subscriptionStartDate: subscriptionStart,
    subscriptionEndDate: subscriptionEnd,
    recurringAmountZar: 0,
    billingCycle: "MONTHLY" as const,
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
          foundingPartner: true,
          partnershipMonths: MAGOME_PARTNERSHIP_MONTHS,
          platformFeeZar: 0,
          platformFeeWaived: true,
          plan: "FOUNDING_PARTNER",
          location: "Boitekong, Rustenburg",
          industry: "Fast Food / Food & Beverage",
          productsInvolved: MAGOME_PRODUCTS,
          intendedProvinces: ["North West"],
          caseStudyPermissionPending: true
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
    const startsAt = subscriptionStart;
    const licenseTermMonths = MAGOME_PARTNERSHIP_MONTHS;
    const endsAt = computeLicenseEndsAt(startsAt, licenseTermMonths);
    const campaignSlug = `${MAGOME_BRAND_SLUG}-pilot`.slice(0, 48);
    const campaign = await prisma.campaign.create({
      data: {
        brandId,
        name: `${MAGOME_BRAND_NAME} × Brand2School`,
        slug: campaignSlug,
        campaignCode: "MG26",
        category: "Fast Food / Food & Beverage",
        infrastructureGoal: "Nutrition",
        startsAt,
        endsAt,
        licenseTermMonths,
        partnershipLabel: buildPartnershipLabel({
          brandName: MAGOME_BRAND_NAME,
          provinceOrTerritory: "Rustenburg, North West",
          sponsorshipTrackId: "NUTRITION_ECOSYSTEM",
          scopeType: "DISTRICT"
        }),
        sponsorshipTrack: "NUTRITION_ECOSYSTEM",
        gracePeriodEndsAt: computeGracePeriodEndsAt({ endsAt, gracePeriodDays: 14 }),
        isActive: false,
        scopeType: "DISTRICT",
        allowedProvinces: ["North West"],
        allowedDistricts: ["Rustenburg", "Boitekong"],
        setupFeeZar: 0,
        paymentVerifiedAt: new Date(),
        rulesConfiguredAt: new Date(),
        commercialStatus: "READY_FOR_APPROVAL",
        targetSubmissions: MAGOME_CAMPAIGN_TARGET,
        impactTarget: {
          tagline: "Every Meal Can Make an Impact.",
          verifiedParticipationsTarget: MAGOME_CAMPAIGN_TARGET,
          pilotSchool: null
        }
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
        category: "Fast Food / Food & Beverage",
        infrastructureGoal: "Nutrition",
        targetSubmissions: MAGOME_CAMPAIGN_TARGET,
        licenseTermMonths: MAGOME_PARTNERSHIP_MONTHS,
        endsAt: computeLicenseEndsAt(subscriptionStart, MAGOME_PARTNERSHIP_MONTHS),
        name: `${MAGOME_BRAND_NAME} × Brand2School`
      }
    });
  }

  if (campaignId) {
    await syncCampaignCommercialStatus(campaignId);
    await ensureFounderCampaignParticipationReady(prisma, brandId, campaignId);
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

  let logoUploaded = false;
  if (!input.skipLogo) {
    logoUploaded = await applyMagomeLogo(prisma, brandId);
  }

  const verificationCode = await ensureBrandVerificationCode(
    prisma,
    brandId,
    MAGOME_BRAND_CODE_PREFIX
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
      action: "FOUNDING_PARTNER_BRAND_BOOTSTRAPPED",
      targetType: "Brand",
      targetId: brandId,
      payload: {
        slug: MAGOME_BRAND_SLUG,
        verificationCode,
        founderExempt: true,
        partnershipMonths: MAGOME_PARTNERSHIP_MONTHS,
        platformFeeZar: 0,
        plan: "FOUNDING_PARTNER",
        homeSortOrder: MAGOME_HOME_SORT_ORDER,
        campaignId,
        brandAdminEmail,
        logoUploaded,
        location: "Boitekong, Rustenburg"
      }
    }
  });

  return {
    brandId,
    slug: MAGOME_BRAND_SLUG,
    codePrefix: MAGOME_BRAND_CODE_PREFIX,
    verificationCode,
    verificationStatus: "FOUNDER_VERIFIED",
    campaignId,
    brandAdminEmail,
    brandAdminCreated,
    partnershipMonths: MAGOME_PARTNERSHIP_MONTHS,
    subscriptionEndDate: subscriptionEnd.toISOString(),
    logoUploaded,
    created
  };
}
