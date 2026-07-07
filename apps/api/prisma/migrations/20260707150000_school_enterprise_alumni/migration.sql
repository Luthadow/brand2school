CREATE TYPE "SchoolAlumniRole" AS ENUM ('ALUMNI', 'BUSINESS_OWNER', 'PROFESSIONAL', 'SPONSOR', 'MENTOR', 'DONOR', 'EMPLOYER');
CREATE TYPE "SchoolAlumniStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "SchoolEnterpriseProjectType" AS ENUM ('PRODUCT', 'PITCH', 'STARTUP_CLUB', 'MINI_COMPANY', 'CHALLENGE_ENTRY');
CREATE TYPE "SchoolEnterpriseProjectStatus" AS ENUM ('IDEA', 'ACTIVE', 'COMPETING', 'AWARDED', 'ARCHIVED');
CREATE TYPE "SchoolInnovationChallengeStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'COMPLETED');

CREATE TABLE "SchoolAlumni" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "graduationYear" INTEGER,
    "profession" TEXT,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "linkedInUrl" TEXT,
    "role" "SchoolAlumniRole" NOT NULL DEFAULT 'ALUMNI',
    "offering" TEXT,
    "status" "SchoolAlumniStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolAlumni_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchoolInnovationChallenge" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "challengeType" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "prizeDescription" TEXT,
    "status" "SchoolInnovationChallengeStatus" NOT NULL DEFAULT 'OPEN',
    "maxEntries" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolInnovationChallenge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchoolEnterpriseProject" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "challengeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "projectType" "SchoolEnterpriseProjectType" NOT NULL,
    "studentLead" TEXT NOT NULL,
    "gradeLevel" TEXT,
    "category" TEXT,
    "status" "SchoolEnterpriseProjectStatus" NOT NULL DEFAULT 'IDEA',
    "revenueZar" INTEGER NOT NULL DEFAULT 0,
    "seekingSponsor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolEnterpriseProject_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SchoolAlumni_schoolId_status_idx" ON "SchoolAlumni"("schoolId", "status");
CREATE INDEX "SchoolAlumni_schoolId_role_idx" ON "SchoolAlumni"("schoolId", "role");
CREATE INDEX "SchoolInnovationChallenge_schoolId_status_startsAt_idx" ON "SchoolInnovationChallenge"("schoolId", "status", "startsAt");
CREATE INDEX "SchoolEnterpriseProject_schoolId_status_idx" ON "SchoolEnterpriseProject"("schoolId", "status");
CREATE INDEX "SchoolEnterpriseProject_schoolId_projectType_idx" ON "SchoolEnterpriseProject"("schoolId", "projectType");
CREATE INDEX "SchoolEnterpriseProject_challengeId_idx" ON "SchoolEnterpriseProject"("challengeId");

ALTER TABLE "SchoolAlumni" ADD CONSTRAINT "SchoolAlumni_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolInnovationChallenge" ADD CONSTRAINT "SchoolInnovationChallenge_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolEnterpriseProject" ADD CONSTRAINT "SchoolEnterpriseProject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolEnterpriseProject" ADD CONSTRAINT "SchoolEnterpriseProject_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "SchoolInnovationChallenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
