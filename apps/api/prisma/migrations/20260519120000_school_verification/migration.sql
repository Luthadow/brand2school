-- CreateEnum
CREATE TYPE "SchoolVerificationStatus" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "SchoolVerification" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "emisNumber" TEXT,
    "status" "SchoolVerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "principalIdPath" TEXT,
    "schoolLetterPath" TEXT,
    "emisEvidencePath" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "reviewerNotes" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolVerification_schoolId_key" ON "SchoolVerification"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolVerification_status_submittedAt_idx" ON "SchoolVerification"("status", "submittedAt");

-- AddForeignKey
ALTER TABLE "SchoolVerification" ADD CONSTRAINT "SchoolVerification_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
