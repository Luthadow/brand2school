-- Commercial governance: brand onboarding, agreements, invoices, campaign activation gates

CREATE TYPE "BrandOnboardingStatus" AS ENUM (
  'PENDING_REVIEW',
  'UNDER_APPROVAL',
  'AGREEMENT_PENDING',
  'COMMERCIALLY_ACTIVE',
  'SUSPENDED'
);

CREATE TYPE "BrandAgreementStatus" AS ENUM (
  'DRAFT',
  'GENERATED',
  'AWAITING_SIGNATURE',
  'UPLOADED',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE "CampaignCommercialStatus" AS ENUM (
  'DRAFT',
  'AWAITING_AGREEMENT',
  'AWAITING_PAYMENT',
  'AWAITING_CODES',
  'AWAITING_LAUNCH',
  'LIVE',
  'PAUSED'
);

CREATE TYPE "CampaignInvoiceType" AS ENUM (
  'SETUP_FEE',
  'CONTRIBUTION_POOL',
  'SAAS_SUBSCRIPTION'
);

CREATE TYPE "CampaignInvoiceStatus" AS ENUM (
  'DRAFT',
  'ISSUED',
  'PAYMENT_REPORTED',
  'VERIFIED',
  'VOID'
);

ALTER TYPE "CodeStatus" ADD VALUE IF NOT EXISTS 'BLOCKED';

ALTER TABLE "Brand" ADD COLUMN "onboardingStatus" "BrandOnboardingStatus" NOT NULL DEFAULT 'PENDING_REVIEW';
ALTER TABLE "Brand" ADD COLUMN "legalName" TEXT;
ALTER TABLE "Brand" ADD COLUMN "registrationNumber" TEXT;
ALTER TABLE "Brand" ADD COLUMN "vatNumber" TEXT;
ALTER TABLE "Brand" ADD COLUMN "primaryContactEmail" TEXT;
ALTER TABLE "Brand" ADD COLUMN "contactPersons" JSONB;
ALTER TABLE "Brand" ADD COLUMN "intendedProvinces" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Brand" ADD COLUMN "campaignIntention" TEXT;
ALTER TABLE "Brand" ADD COLUMN "productsInvolved" TEXT;
ALTER TABLE "Brand" ADD COLUMN "internalReviewNotes" TEXT;

ALTER TABLE "Campaign" ADD COLUMN "commercialStatus" "CampaignCommercialStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "Campaign" ADD COLUMN "setupFeeZar" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Campaign" ADD COLUMN "contributionPoolZar" DECIMAL(14,2);
ALTER TABLE "Campaign" ADD COLUMN "paymentVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Campaign" ADD COLUMN "codesApprovedAt" TIMESTAMP(3);
ALTER TABLE "Campaign" ADD COLUMN "rulesConfiguredAt" TIMESTAMP(3);
ALTER TABLE "Campaign" ADD COLUMN "launchApprovedAt" TIMESTAMP(3);

ALTER TABLE "Code" ADD COLUMN "redeemedProvince" TEXT;
ALTER TABLE "Code" ADD COLUMN "redeemedBy" TEXT;

CREATE TABLE "BrandAgreement" (
  "id" TEXT NOT NULL,
  "brandId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" "BrandAgreementStatus" NOT NULL DEFAULT 'DRAFT',
  "generatedPdfPath" TEXT,
  "signedPdfPath" TEXT,
  "scopeSnapshot" JSONB,
  "generatedAt" TIMESTAMP(3),
  "uploadedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "approvedByUserId" TEXT,
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BrandAgreement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CampaignInvoice" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  "invoiceType" "CampaignInvoiceType" NOT NULL,
  "amountZar" DECIMAL(12,2) NOT NULL,
  "status" "CampaignInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "eftReference" TEXT,
  "issuedAt" TIMESTAMP(3),
  "paymentReportedAt" TIMESTAMP(3),
  "verifiedAt" TIMESTAMP(3),
  "verifiedByUserId" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CampaignInvoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BrandAgreement_brandId_version_key" ON "BrandAgreement"("brandId", "version");
CREATE INDEX "BrandAgreement_brandId_status_idx" ON "BrandAgreement"("brandId", "status");

CREATE UNIQUE INDEX "CampaignInvoice_invoiceNumber_key" ON "CampaignInvoice"("invoiceNumber");
CREATE INDEX "CampaignInvoice_campaignId_status_idx" ON "CampaignInvoice"("campaignId", "status");
CREATE INDEX "CampaignInvoice_invoiceType_status_idx" ON "CampaignInvoice"("invoiceType", "status");
CREATE INDEX "Campaign_commercialStatus_idx" ON "Campaign"("commercialStatus");

ALTER TABLE "BrandAgreement" ADD CONSTRAINT "BrandAgreement_brandId_fkey"
  FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CampaignInvoice" ADD CONSTRAINT "CampaignInvoice_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing live campaigns: mark rules configured where scope already set
UPDATE "Campaign"
SET "rulesConfiguredAt" = COALESCE("rulesConfiguredAt", "updatedAt")
WHERE "scopeType" IS NOT NULL;

UPDATE "Campaign"
SET "commercialStatus" = 'LIVE', "launchApprovedAt" = COALESCE("launchApprovedAt", "updatedAt")
WHERE "isActive" = true;

UPDATE "Brand"
SET "onboardingStatus" = 'COMMERCIALLY_ACTIVE'
WHERE "status" = 'ACTIVE';
