-- AlterTable
ALTER TABLE "Brand" ADD COLUMN "slug" TEXT,
ADD COLUMN "publicProfileEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "description" TEXT;

-- Backfill slug from codePrefix (URL-safe lowercase)
UPDATE "Brand" SET "slug" = LOWER("codePrefix") WHERE "slug" IS NULL;

ALTER TABLE "Brand" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");
