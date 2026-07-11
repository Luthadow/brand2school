CREATE TABLE "BrandWishlistNomination" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "categoryLabel" TEXT NOT NULL,
  "brandId" TEXT NOT NULL,
  "brandName" TEXT NOT NULL,
  "provinceCode" TEXT NOT NULL,
  "provinceName" TEXT NOT NULL,
  "contactName" TEXT,
  "schoolName" TEXT,
  "reason" TEXT,
  "source" TEXT NOT NULL DEFAULT 'web',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BrandWishlistNomination_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BrandWishlistNomination_brandId_createdAt_idx" ON "BrandWishlistNomination"("brandId", "createdAt");
CREATE INDEX "BrandWishlistNomination_categoryId_createdAt_idx" ON "BrandWishlistNomination"("categoryId", "createdAt");
CREATE INDEX "BrandWishlistNomination_provinceCode_createdAt_idx" ON "BrandWishlistNomination"("provinceCode", "createdAt");
