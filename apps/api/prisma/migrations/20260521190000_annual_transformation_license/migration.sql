-- Annual transformation licenses: renewable partnerships (not permanent territorial ownership)

ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "partnershipLabel" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "sponsorshipTrack" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "licenseTermMonths" INTEGER NOT NULL DEFAULT 12;
