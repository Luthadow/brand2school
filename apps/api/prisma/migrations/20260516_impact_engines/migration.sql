-- Infrastructure Progress + Funding Conversion engines

ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "infrastructureItems" JSONB;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "fundingBalanceZar" DECIMAL(14,2) NOT NULL DEFAULT 0;

ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "contributionPerCodeZar" DECIMAL(10,2) NOT NULL DEFAULT 1;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "fundSplit" JSONB;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "impactTarget" JSONB;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "fundingRaisedZar" DECIMAL(14,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "FundingContribution" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "brandId" TEXT NOT NULL,
  "grossAmountZar" DECIMAL(10,2) NOT NULL,
  "allocations" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FundingContribution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FundingContribution_submissionId_key" ON "FundingContribution"("submissionId");
CREATE INDEX IF NOT EXISTS "FundingContribution_schoolId_createdAt_idx" ON "FundingContribution"("schoolId", "createdAt");
CREATE INDEX IF NOT EXISTS "FundingContribution_campaignId_createdAt_idx" ON "FundingContribution"("campaignId", "createdAt");
CREATE INDEX IF NOT EXISTS "FundingContribution_brandId_createdAt_idx" ON "FundingContribution"("brandId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "FundingContribution" ADD CONSTRAINT "FundingContribution_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FundingContribution" ADD CONSTRAINT "FundingContribution_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FundingContribution" ADD CONSTRAINT "FundingContribution_submissionId_fkey"
    FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
