-- Campaign geo-fencing and budget caps (eligibility rules, not product locks)

CREATE TYPE "CampaignScopeType" AS ENUM ('NATIONAL', 'PROVINCIAL', 'DISTRICT', 'SCHOOL_CLUSTER');

ALTER TABLE "Campaign" ADD COLUMN "scopeType" "CampaignScopeType" NOT NULL DEFAULT 'NATIONAL';
ALTER TABLE "Campaign" ADD COLUMN "allowedProvinces" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Campaign" ADD COLUMN "allowedDistricts" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Campaign" ADD COLUMN "allowedSchoolIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Campaign" ADD COLUMN "budgetAllocatedZar" DECIMAL(14,2);
ALTER TABLE "Campaign" ADD COLUMN "budgetConsumedZar" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "Campaign" ADD COLUMN "pauseOnBudgetExhausted" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Campaign" ADD COLUMN "overflowCampaignId" TEXT;

ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_overflowCampaignId_fkey"
  FOREIGN KEY ("overflowCampaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Campaign_scopeType_isActive_idx" ON "Campaign"("scopeType", "isActive");
