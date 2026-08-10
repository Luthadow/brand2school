-- Campaign code mode + 50-code batch inventory / download audit.

CREATE TYPE "CampaignCodeMode" AS ENUM ('UPLOAD', 'GENERATE');
CREATE TYPE "CodeBatchStatus" AS ENUM ('AVAILABLE', 'DISTRIBUTED', 'PARTIALLY_USED', 'USED', 'EXPIRED');

ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "codeMode" "CampaignCodeMode";

ALTER TABLE "CodeBatch" ADD COLUMN IF NOT EXISTS "status" "CodeBatchStatus" NOT NULL DEFAULT 'AVAILABLE';
ALTER TABLE "CodeBatch" ADD COLUMN IF NOT EXISTS "source" "CampaignCodeMode";
ALTER TABLE "CodeBatch" ADD COLUMN IF NOT EXISTS "downloadedAt" TIMESTAMP(3);
ALTER TABLE "CodeBatch" ADD COLUMN IF NOT EXISTS "downloadCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CodeBatch" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;

CREATE TABLE IF NOT EXISTS "CodeBatchDownload" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "downloadedByUserId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "codeCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CodeBatchDownload_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CodeBatch_campaignId_status_idx" ON "CodeBatch"("campaignId", "status");
CREATE INDEX IF NOT EXISTS "CodeBatchDownload_batchId_createdAt_idx" ON "CodeBatchDownload"("batchId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "CodeBatchDownload" ADD CONSTRAINT "CodeBatchDownload_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "CodeBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
