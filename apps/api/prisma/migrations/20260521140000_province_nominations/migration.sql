CREATE TABLE "ProvinceNomination" (
  "id" TEXT NOT NULL,
  "provinceCode" TEXT NOT NULL,
  "provinceName" TEXT NOT NULL,
  "schoolName" TEXT,
  "district" TEXT,
  "contactName" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "campaignSlug" TEXT,
  "message" TEXT,
  "source" TEXT NOT NULL DEFAULT 'web',
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProvinceNomination_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProvinceNomination_provinceCode_createdAt_idx" ON "ProvinceNomination"("provinceCode", "createdAt");
CREATE INDEX "ProvinceNomination_status_createdAt_idx" ON "ProvinceNomination"("status", "createdAt");
