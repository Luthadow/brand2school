-- Align trust layer with operational status for brands already live before verification rollout.
UPDATE "Brand"
SET "verificationStatus" = 'FOUNDER_VERIFIED'
WHERE "founderExempt" = true
  AND "status" IN ('ACTIVE', 'APPROVED', 'VERIFIED')
  AND "verificationStatus" = 'PENDING';

UPDATE "Brand"
SET "verificationStatus" = 'VERIFIED'
WHERE "founderExempt" = false
  AND "status" IN ('ACTIVE', 'APPROVED', 'VERIFIED')
  AND "verificationStatus" = 'PENDING';

UPDATE "Brand"
SET "verifiedAt" = COALESCE("verifiedAt", "updatedAt", CURRENT_TIMESTAMP)
WHERE "verificationStatus" IN ('VERIFIED', 'FOUNDER_VERIFIED')
  AND "verifiedAt" IS NULL;

UPDATE "Brand"
SET "verificationStatus" = 'SUSPENDED'
WHERE "status" = 'SUSPENDED'
  AND "verificationStatus" NOT IN ('SUSPENDED', 'REJECTED');

-- Clear orphan verifier references before FK (safe for partial deploys).
UPDATE "Brand" SET "verifiedByUserId" = NULL
WHERE "verifiedByUserId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = "Brand"."verifiedByUserId");

-- Foreign key: admin who approved verification (optional).
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_verifiedByUserId_fkey"
  FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes for public directory, admin filters, and homepage ordering.
CREATE INDEX "Brand_verificationStatus_idx" ON "Brand"("verificationStatus");
CREATE INDEX "Brand_status_verificationStatus_idx" ON "Brand"("status", "verificationStatus");
CREATE INDEX "Brand_homeSortOrder_idx" ON "Brand"("homeSortOrder");
CREATE INDEX "Brand_founderExempt_idx" ON "Brand"("founderExempt");
CREATE INDEX "WhatsAppConversation_updatedAt_idx" ON "WhatsAppConversation"("updatedAt");
