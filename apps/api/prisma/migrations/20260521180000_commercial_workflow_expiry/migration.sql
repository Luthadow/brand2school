-- Commercial workflow stages, campaign expiry governance, impact commitment tracking

CREATE TYPE "CampaignRenewalStatus" AS ENUM ('NONE', 'PENDING_RENEWAL', 'RENEWED', 'LAPSED');

ALTER TYPE "CampaignCommercialStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_APPROVAL';
ALTER TYPE "CampaignCommercialStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';
ALTER TYPE "CampaignCommercialStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

ALTER TABLE "Campaign" ADD COLUMN "gracePeriodDays" INTEGER NOT NULL DEFAULT 14;
ALTER TABLE "Campaign" ADD COLUMN "gracePeriodEndsAt" TIMESTAMP(3);
ALTER TABLE "Campaign" ADD COLUMN "renewalStatus" "CampaignRenewalStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Campaign" ADD COLUMN "autoSuspendOnExpiry" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Campaign" ADD COLUMN "expiredAt" TIMESTAMP(3);
ALTER TABLE "Campaign" ADD COLUMN "impactCommitment" JSONB;
ALTER TABLE "Campaign" ADD COLUMN "impactDelivered" JSONB;

UPDATE "Campaign"
SET "gracePeriodEndsAt" = "endsAt" + INTERVAL '14 days'
WHERE "gracePeriodEndsAt" IS NULL;

UPDATE "Campaign"
SET "commercialStatus" = 'READY_FOR_APPROVAL'
WHERE "commercialStatus" = 'AWAITING_LAUNCH';
