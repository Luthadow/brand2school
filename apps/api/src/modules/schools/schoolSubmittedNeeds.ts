import type { SchoolNeedStatus } from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";

export type SchoolSubmittedNeedItem = {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  urgency: string;
  description: string;
  learnerImpact: number;
  estimatedCostZar: number;
  progressPercent: number;
  sponsorStatus: string;
  photoCount: number;
  quoteCount: number;
  status: SchoolNeedStatus;
  submittedAt: string;
};

export function serializeSubmittedNeed(
  row: Awaited<ReturnType<typeof listSchoolSubmittedNeeds>>[number]
): SchoolSubmittedNeedItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    subcategory: row.subcategory,
    urgency: row.urgency,
    description: row.description,
    learnerImpact: row.learnerImpact,
    estimatedCostZar: row.estimatedCostZar,
    progressPercent: row.progressPercent,
    sponsorStatus: row.sponsorStatus,
    photoCount: row.photoCount,
    quoteCount: row.quoteCount,
    status: row.status,
    submittedAt: row.createdAt.toISOString()
  };
}

export async function listSchoolSubmittedNeeds(schoolId: string) {
  return prisma.schoolSubmittedNeed.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" }
  });
}

export async function createSchoolSubmittedNeed(
  schoolId: string,
  data: {
    title: string;
    category: string;
    subcategory: string;
    urgency: string;
    description: string;
    learnerImpact: number;
    estimatedCostZar: number;
  }
) {
  return prisma.schoolSubmittedNeed.create({
    data: {
      schoolId,
      ...data,
      status: "SUBMITTED",
      sponsorStatus: "Pending brand review"
    }
  });
}
