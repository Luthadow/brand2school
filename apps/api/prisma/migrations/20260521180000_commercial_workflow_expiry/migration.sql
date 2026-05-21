-- Commercial workflow stages, campaign expiry governance (columns only).
-- Enum values are added in separate migrations (Postgres cannot add multiple enum values in one transaction).

DO $$ BEGIN
  CREATE TYPE "CampaignRenewalStatus" AS ENUM ('NONE', 'PENDING_RENEWAL', 'RENEWED', 'LAPSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "gracePeriodDays" INTEGER NOT NULL DEFAULT 14;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "gracePeriodEndsAt" TIMESTAMP(3);
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "renewalStatus" "CampaignRenewalStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "autoSuspendOnExpiry" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "expiredAt" TIMESTAMP(3);
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "impactCommitment" JSONB;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "impactDelivered" JSONB;

UPDATE "Campaign"
SET "gracePeriodEndsAt" = "endsAt" + INTERVAL '14 days'
WHERE "gracePeriodEndsAt" IS NULL;
