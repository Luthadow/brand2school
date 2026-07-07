CREATE TYPE "SchoolEventStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "SchoolVolunteerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

CREATE TABLE "SchoolVolunteer" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "skills" TEXT,
    "hoursLogged" INTEGER NOT NULL DEFAULT 0,
    "status" "SchoolVolunteerStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolVolunteer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchoolEvent" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "location" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "volunteerSlots" INTEGER NOT NULL DEFAULT 0,
    "status" "SchoolEventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchoolEventVolunteer" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolEventVolunteer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SchoolVolunteer_schoolId_status_idx" ON "SchoolVolunteer"("schoolId", "status");
CREATE INDEX "SchoolEvent_schoolId_status_startsAt_idx" ON "SchoolEvent"("schoolId", "status", "startsAt");
CREATE UNIQUE INDEX "SchoolEventVolunteer_eventId_volunteerId_key" ON "SchoolEventVolunteer"("eventId", "volunteerId");
CREATE INDEX "SchoolEventVolunteer_volunteerId_idx" ON "SchoolEventVolunteer"("volunteerId");

ALTER TABLE "SchoolVolunteer" ADD CONSTRAINT "SchoolVolunteer_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolEvent" ADD CONSTRAINT "SchoolEvent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolEventVolunteer" ADD CONSTRAINT "SchoolEventVolunteer_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SchoolEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolEventVolunteer" ADD CONSTRAINT "SchoolEventVolunteer_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "SchoolVolunteer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
