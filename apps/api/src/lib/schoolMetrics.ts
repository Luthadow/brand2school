import type { Prisma } from "../generated/prisma/index.js";

/** Schools that completed public registration (awaiting or past governance approval). */
export const REGISTERED_SCHOOL_STATUSES = ["PENDING", "VERIFIED", "APPROVED", "ACTIVE"] as const;

/** Schools cleared for campaign participation (post-approval). */
export const PARTICIPATING_SCHOOL_STATUSES = ["VERIFIED", "APPROVED", "ACTIVE"] as const;

export const registeredSchoolWhere = {
  status: { in: [...REGISTERED_SCHOOL_STATUSES] }
} satisfies Prisma.SchoolWhereInput;

export const participatingSchoolWhere = {
  status: { in: [...PARTICIPATING_SCHOOL_STATUSES] }
} satisfies Prisma.SchoolWhereInput;
