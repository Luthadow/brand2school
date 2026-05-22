import bcrypt from "bcryptjs";
import type { PrismaClient } from "../generated/prisma/index.js";

/** Shared demo password — change in production after first login. */
export const DEMO_PASSWORD = "ChangeMe123!";

export const DEMO_LOGINS = {
  superAdmin: {
    email: "superadmin@brand2school.co.za",
    role: "SUPER_ADMIN",
    portal: "Admin",
    url: "https://admin.brand2school.co.za/login"
  },
  school: {
    email: "demo.school@brand2school.co.za",
    role: "SCHOOL_ADMIN",
    portal: "School",
    url: "https://www.brand2school.co.za/school/login",
    schoolCode: "LANGA-DEMO-GP"
  },
  brand: {
    email: "demo.brand@brand2school.co.za",
    role: "BRAND_ADMIN",
    portal: "Brand",
    url: "https://www.brand2school.co.za/brand/login",
    brand: "Demo Beverage Partner",
    campaign: "demo-back-to-school"
  }
} as const;

export type DemoSeedSummary = {
  password: string;
  users: Array<{ email: string; role: string }>;
  schoolCode: string;
  brandSlug: string;
  campaignSlug: string;
};

/** Idempotent demo data: super admin + school + brand + live campaign. */
export async function runDemoSeed(prisma: PrismaClient): Promise<DemoSeedSummary> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const year = new Date().getFullYear();
  const campaignStarts = new Date();
  const campaignEnds = new Date();
  campaignEnds.setFullYear(campaignEnds.getFullYear() + 1);

  await prisma.user.upsert({
    where: { email: DEMO_LOGINS.superAdmin.email },
    update: { passwordHash, role: "SUPER_ADMIN", status: "ACTIVE" },
    create: {
      fullName: "Super Admin",
      email: DEMO_LOGINS.superAdmin.email,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE"
    }
  });

  const school = await prisma.school.upsert({
    where: { schoolCode: DEMO_LOGINS.school.schoolCode },
    update: {
      status: "ACTIVE",
      name: "Langa Secondary School (Demo)",
      principalName: "Demo Principal",
      contactEmail: DEMO_LOGINS.school.email
    },
    create: {
      name: "Langa Secondary School (Demo)",
      province: "Western Cape",
      district: "Cape Town",
      principalName: "Demo Principal",
      contactEmail: DEMO_LOGINS.school.email,
      whatsappPhone: "27821234567",
      schoolCode: DEMO_LOGINS.school.schoolCode,
      status: "ACTIVE",
      developmentTier: 2,
      currentPhase: 2,
      annualCycleYear: year,
      annualCycleFocus: "Safety & Sanitation",
      developmentScores: {
        infrastructure: 42,
        digital: 28,
        sports: 35,
        nutrition: 30,
        governance: 55
      }
    }
  });

  await prisma.schoolVerification.upsert({
    where: { schoolId: school.id },
    update: { status: "APPROVED", reviewedAt: new Date() },
    create: {
      schoolId: school.id,
      status: "APPROVED",
      emisNumber: "DEMO-EMIS-001",
      submittedAt: new Date(),
      reviewedAt: new Date()
    }
  });

  await prisma.user.upsert({
    where: { email: DEMO_LOGINS.school.email },
    update: {
      passwordHash,
      role: "SCHOOL_ADMIN",
      status: "ACTIVE",
      schoolId: school.id,
      fullName: "Demo Principal"
    },
    create: {
      fullName: "Demo Principal",
      email: DEMO_LOGINS.school.email,
      passwordHash,
      role: "SCHOOL_ADMIN",
      status: "ACTIVE",
      schoolId: school.id
    }
  });

  const brand = await prisma.brand.upsert({
    where: { codePrefix: "DEMO" },
    update: {
      status: "ACTIVE",
      onboardingStatus: "COMMERCIALLY_ACTIVE",
      subscriptionStatus: "ACTIVE",
      activationFeePaid: true
    },
    create: {
      name: DEMO_LOGINS.brand.brand,
      codePrefix: "DEMO",
      slug: "demo-beverage-partner",
      status: "ACTIVE",
      onboardingStatus: "COMMERCIALLY_ACTIVE",
      legalName: "Demo Beverage Partner (Pty) Ltd",
      registrationNumber: "DEMO-CIPC-0001",
      primaryContactEmail: DEMO_LOGINS.brand.email,
      intendedProvinces: ["Gauteng", "Western Cape"],
      campaignIntention: "Demo campaign for platform walkthrough.",
      productsInvolved: "Demo juice packs with participation codes.",
      subscriptionStatus: "ACTIVE",
      subscriptionPlan: "PROVINCIAL",
      subscriptionStartDate: new Date(),
      activationFeePaid: true,
      recurringAmountZar: 35000,
      featuredOnHome: true,
      publicProfileEnabled: true
    }
  });

  await prisma.user.upsert({
    where: { email: DEMO_LOGINS.brand.email },
    update: {
      passwordHash,
      role: "BRAND_ADMIN",
      status: "ACTIVE",
      brandId: brand.id,
      fullName: "Demo Brand Manager"
    },
    create: {
      fullName: "Demo Brand Manager",
      email: DEMO_LOGINS.brand.email,
      passwordHash,
      role: "BRAND_ADMIN",
      status: "ACTIVE",
      brandId: brand.id
    }
  });

  await prisma.campaign.upsert({
    where: { slug: DEMO_LOGINS.brand.campaign },
    update: {
      isActive: true,
      commercialStatus: "LIVE",
      paymentVerifiedAt: new Date(),
      codesApprovedAt: new Date(),
      launchApprovedAt: new Date()
    },
    create: {
      brandId: brand.id,
      name: "Demo Back-to-School Essentials",
      slug: DEMO_LOGINS.brand.campaign,
      campaignCode: "DEMO26",
      category: "Learning Essentials",
      infrastructureGoal: "Classroom desks, books and uniforms",
      startsAt: campaignStarts,
      endsAt: campaignEnds,
      isActive: true,
      commercialStatus: "LIVE",
      targetSubmissions: 100,
      contributionPerCodeZar: 5,
      scopeType: "NATIONAL",
      allowedProvinces: ["Gauteng", "Western Cape", "KwaZulu-Natal"],
      paymentVerifiedAt: new Date(),
      codesApprovedAt: new Date(),
      rulesConfiguredAt: new Date(),
      launchApprovedAt: new Date(),
      setupFeeZar: 75000,
      contributionPoolZar: 500000
    }
  });

  return {
    password: DEMO_PASSWORD,
    users: [
      { email: DEMO_LOGINS.superAdmin.email, role: "SUPER_ADMIN" },
      { email: DEMO_LOGINS.school.email, role: "SCHOOL_ADMIN" },
      { email: DEMO_LOGINS.brand.email, role: "BRAND_ADMIN" }
    ],
    schoolCode: DEMO_LOGINS.school.schoolCode,
    brandSlug: "demo-beverage-partner",
    campaignSlug: DEMO_LOGINS.brand.campaign
  };
}
