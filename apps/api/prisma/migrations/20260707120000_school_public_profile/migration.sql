-- School Success Platform S2: public profile + submitted needs
CREATE TYPE "SchoolNeedStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'FUNDED', 'DECLINED');

ALTER TABLE "School" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "School" ADD COLUMN "logoPng" BYTEA;
ALTER TABLE "School" ADD COLUMN "websiteUrl" TEXT;
ALTER TABLE "School" ADD COLUMN "publicPhone" TEXT;
ALTER TABLE "School" ADD COLUMN "quintile" INTEGER;
ALTER TABLE "School" ADD COLUMN "teacherCount" INTEGER;
ALTER TABLE "School" ADD COLUMN "gpsLat" DOUBLE PRECISION;
ALTER TABLE "School" ADD COLUMN "gpsLng" DOUBLE PRECISION;
ALTER TABLE "School" ADD COLUMN "publicProfile" JSONB;

CREATE TABLE "SchoolSubmittedNeed" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "learnerImpact" INTEGER NOT NULL,
    "estimatedCostZar" INTEGER NOT NULL,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "sponsorStatus" TEXT NOT NULL DEFAULT 'Pending',
    "photoCount" INTEGER NOT NULL DEFAULT 0,
    "quoteCount" INTEGER NOT NULL DEFAULT 0,
    "status" "SchoolNeedStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolSubmittedNeed_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SchoolSubmittedNeed_schoolId_status_idx" ON "SchoolSubmittedNeed"("schoolId", "status");
CREATE INDEX "SchoolSubmittedNeed_schoolId_createdAt_idx" ON "SchoolSubmittedNeed"("schoolId", "createdAt");

ALTER TABLE "SchoolSubmittedNeed" ADD CONSTRAINT "SchoolSubmittedNeed_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
