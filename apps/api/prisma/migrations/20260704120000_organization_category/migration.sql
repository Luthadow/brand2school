-- Organisation category for participant entities (schools and other org types share the School table).
CREATE TYPE "OrganizationCategory" AS ENUM ('SCHOOL', 'NGO_NPO', 'COMMUNITY', 'FAITH');

ALTER TABLE "School"
ADD COLUMN "organizationCategory" "OrganizationCategory" NOT NULL DEFAULT 'SCHOOL';

ALTER TABLE "SchoolVerification"
ADD COLUMN "registrationNumber" TEXT,
ADD COLUMN "documentPaths" JSONB;

CREATE INDEX "School_organizationCategory_idx" ON "School"("organizationCategory");
