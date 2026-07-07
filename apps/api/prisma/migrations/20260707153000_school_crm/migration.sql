CREATE TYPE "SchoolCrmContactType" AS ENUM ('BRAND', 'PARENT', 'SGB', 'DONOR', 'SUPPORT', 'PARTNER', 'OTHER');
CREATE TYPE "SchoolCrmActivityType" AS ENUM ('MEETING', 'CALL', 'EMAIL', 'SUPPORT', 'NOTE', 'DOCUMENT', 'CAMPAIGN', 'RENEWAL');
CREATE TYPE "SchoolCrmTaskStatus" AS ENUM ('OPEN', 'DONE', 'CANCELLED');
CREATE TYPE "SchoolCrmTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE "SchoolCrmContact" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "organization" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "contactType" "SchoolCrmContactType" NOT NULL DEFAULT 'OTHER',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolCrmContact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchoolCrmActivity" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "contactId" TEXT,
    "activityType" "SchoolCrmActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolCrmActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchoolCrmTask" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "contactId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3),
    "status" "SchoolCrmTaskStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "SchoolCrmTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolCrmTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SchoolCrmContact_schoolId_contactType_idx" ON "SchoolCrmContact"("schoolId", "contactType");
CREATE INDEX "SchoolCrmActivity_schoolId_occurredAt_idx" ON "SchoolCrmActivity"("schoolId", "occurredAt");
CREATE INDEX "SchoolCrmActivity_schoolId_activityType_idx" ON "SchoolCrmActivity"("schoolId", "activityType");
CREATE INDEX "SchoolCrmActivity_contactId_idx" ON "SchoolCrmActivity"("contactId");
CREATE INDEX "SchoolCrmTask_schoolId_status_dueAt_idx" ON "SchoolCrmTask"("schoolId", "status", "dueAt");
CREATE INDEX "SchoolCrmTask_contactId_idx" ON "SchoolCrmTask"("contactId");

ALTER TABLE "SchoolCrmContact" ADD CONSTRAINT "SchoolCrmContact_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolCrmActivity" ADD CONSTRAINT "SchoolCrmActivity_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolCrmActivity" ADD CONSTRAINT "SchoolCrmActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "SchoolCrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SchoolCrmTask" ADD CONSTRAINT "SchoolCrmTask_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolCrmTask" ADD CONSTRAINT "SchoolCrmTask_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "SchoolCrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
