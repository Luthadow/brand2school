import { prisma } from "../../lib/prisma.js";
import { VERIFIED_SCHOOL_STATUSES } from "./verifiedSchools.js";

type VerifiedSchoolStatus = (typeof VERIFIED_SCHOOL_STATUSES)[number];

function isVerifiedSchoolStatus(status: string): status is VerifiedSchoolStatus {
  return (VERIFIED_SCHOOL_STATUSES as readonly string[]).includes(status);
}

export async function removeVerifiedSchool(schoolId: string): Promise<
  | {
      ok: true;
      message: string;
      removed: {
        schoolId: string;
        name: string;
        schoolCode: string;
        status: string;
        organizationCategory: string;
        contactEmail: string | null;
        whatsappPhone: string;
        adminUserId: string | null;
        adminEmail: string | null;
      };
    }
  | { ok: false; status: number; message: string }
> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { adminUser: { select: { id: true, email: true } } }
  });

  if (!school) {
    return { ok: false, status: 404, message: "Organisation not found." };
  }

  if (!isVerifiedSchoolStatus(school.status)) {
    return {
      ok: false,
      status: 409,
      message: `Only verified, approved, or active organisations can be removed here. Current status: ${school.status}.`
    };
  }

  const removed = {
    schoolId: school.id,
    name: school.name,
    schoolCode: school.schoolCode,
    status: school.status,
    organizationCategory: school.organizationCategory,
    contactEmail: school.contactEmail,
    whatsappPhone: school.whatsappPhone,
    adminUserId: school.adminUser?.id ?? null,
    adminEmail: school.adminUser?.email ?? null
  };

  await prisma.$transaction(async (tx) => {
    if (school.adminUser) {
      await tx.user.delete({ where: { id: school.adminUser.id } });
    }
    await tx.school.delete({ where: { id: school.id } });
  });

  return {
    ok: true,
    message: `${school.name} has been removed. They must register again to rejoin the platform.`,
    removed
  };
}
