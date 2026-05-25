-- CreateEnum
CREATE TYPE "BrandVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FOUNDER_VERIFIED', 'SUSPENDED', 'REJECTED');

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN "verificationCode" TEXT,
ADD COLUMN "verificationStatus" "BrandVerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "verifiedAt" TIMESTAMP(3),
ADD COLUMN "verifiedByUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Brand_verificationCode_key" ON "Brand"("verificationCode");
