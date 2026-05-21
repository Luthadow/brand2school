-- AlterTable
ALTER TABLE "Brand" ADD COLUMN "logoUrl" TEXT,
ADD COLUMN "featuredOnHome" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "websiteUrl" TEXT,
ADD COLUMN "brandColor" TEXT;
