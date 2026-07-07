import type {
  SchoolEnterpriseProjectStatus,
  SchoolEnterpriseProjectType,
  SchoolInnovationChallengeStatus
} from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";

export const PROJECT_TYPES: Record<SchoolEnterpriseProjectType, string> = {
  PRODUCT: "Student product",
  PITCH: "Business pitch",
  STARTUP_CLUB: "Startup club",
  MINI_COMPANY: "Mini company",
  CHALLENGE_ENTRY: "Challenge entry"
};

export const CHALLENGE_TYPES: Record<string, string> = {
  pitch: "Pitch competition",
  innovation: "Innovation challenge",
  business_competition: "Business competition",
  startup_club: "Startup club showcase",
  expo: "Entrepreneurship expo"
};

export type SchoolEnterpriseProjectItem = {
  id: string;
  title: string;
  description: string | null;
  projectType: SchoolEnterpriseProjectType;
  projectTypeLabel: string;
  studentLead: string;
  gradeLevel: string | null;
  category: string | null;
  status: SchoolEnterpriseProjectStatus;
  revenueZar: number;
  seekingSponsor: boolean;
  challengeId: string | null;
  challengeTitle: string | null;
  createdAt: string;
};

export type SchoolInnovationChallengeItem = {
  id: string;
  title: string;
  description: string | null;
  challengeType: string;
  challengeTypeLabel: string;
  startsAt: string;
  endsAt: string | null;
  prizeDescription: string | null;
  status: SchoolInnovationChallengeStatus;
  maxEntries: number;
  entriesCount: number;
  createdAt: string;
};

export function projectTypeLabel(type: SchoolEnterpriseProjectType): string {
  return PROJECT_TYPES[type] ?? type;
}

export function challengeTypeLabel(type: string): string {
  return CHALLENGE_TYPES[type] ?? type;
}

export function serializeProject(
  row: Awaited<ReturnType<typeof listSchoolEnterpriseProjects>>[number]
): SchoolEnterpriseProjectItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    projectType: row.projectType,
    projectTypeLabel: projectTypeLabel(row.projectType),
    studentLead: row.studentLead,
    gradeLevel: row.gradeLevel,
    category: row.category,
    status: row.status,
    revenueZar: row.revenueZar,
    seekingSponsor: row.seekingSponsor,
    challengeId: row.challengeId,
    challengeTitle: row.challenge?.title ?? null,
    createdAt: row.createdAt.toISOString()
  };
}

export function serializeChallenge(
  row: Awaited<ReturnType<typeof listSchoolInnovationChallenges>>[number]
): SchoolInnovationChallengeItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    challengeType: row.challengeType,
    challengeTypeLabel: challengeTypeLabel(row.challengeType),
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
    prizeDescription: row.prizeDescription,
    status: row.status,
    maxEntries: row.maxEntries,
    entriesCount: row._count.projects,
    createdAt: row.createdAt.toISOString()
  };
}

export async function listSchoolEnterpriseProjects(schoolId: string) {
  return prisma.schoolEnterpriseProject.findMany({
    where: { schoolId, status: { not: "ARCHIVED" } },
    include: { challenge: { select: { title: true } } },
    orderBy: { createdAt: "desc" }
  });
}

export async function createSchoolEnterpriseProject(
  schoolId: string,
  data: {
    title: string;
    description?: string | null;
    projectType: SchoolEnterpriseProjectType;
    studentLead: string;
    gradeLevel?: string | null;
    category?: string | null;
    status?: SchoolEnterpriseProjectStatus;
    revenueZar?: number;
    seekingSponsor?: boolean;
    challengeId?: string | null;
  }
) {
  if (data.challengeId) {
    const challenge = await prisma.schoolInnovationChallenge.findFirst({
      where: { id: data.challengeId, schoolId }
    });
    if (!challenge) return null;
  }

  return prisma.schoolEnterpriseProject.create({
    data: {
      schoolId,
      title: data.title,
      description: data.description ?? null,
      projectType: data.projectType,
      studentLead: data.studentLead,
      gradeLevel: data.gradeLevel ?? null,
      category: data.category ?? null,
      status: data.status ?? "IDEA",
      revenueZar: data.revenueZar ?? 0,
      seekingSponsor: data.seekingSponsor ?? false,
      challengeId: data.challengeId ?? null
    }
  });
}

export async function updateSchoolEnterpriseProject(
  schoolId: string,
  projectId: string,
  data: Partial<{
    title: string;
    description: string | null;
    projectType: SchoolEnterpriseProjectType;
    studentLead: string;
    gradeLevel: string | null;
    category: string | null;
    status: SchoolEnterpriseProjectStatus;
    revenueZar: number;
    seekingSponsor: boolean;
    challengeId: string | null;
  }>
) {
  const existing = await prisma.schoolEnterpriseProject.findFirst({
    where: { id: projectId, schoolId }
  });
  if (!existing) return null;
  return prisma.schoolEnterpriseProject.update({
    where: { id: projectId },
    data
  });
}

export async function listSchoolInnovationChallenges(schoolId: string) {
  return prisma.schoolInnovationChallenge.findMany({
    where: { schoolId, status: { notIn: ["DRAFT"] } },
    include: { _count: { select: { projects: true } } },
    orderBy: { startsAt: "desc" }
  });
}

export async function createSchoolInnovationChallenge(
  schoolId: string,
  data: {
    title: string;
    description?: string | null;
    challengeType: string;
    startsAt: Date;
    endsAt?: Date | null;
    prizeDescription?: string | null;
    status?: SchoolInnovationChallengeStatus;
    maxEntries?: number;
  }
) {
  return prisma.schoolInnovationChallenge.create({
    data: {
      schoolId,
      title: data.title,
      description: data.description ?? null,
      challengeType: data.challengeType,
      startsAt: data.startsAt,
      endsAt: data.endsAt ?? null,
      prizeDescription: data.prizeDescription ?? null,
      status: data.status ?? "OPEN",
      maxEntries: data.maxEntries ?? 0
    }
  });
}

export async function updateSchoolInnovationChallenge(
  schoolId: string,
  challengeId: string,
  data: Partial<{
    title: string;
    description: string | null;
    challengeType: string;
    startsAt: Date;
    endsAt: Date | null;
    prizeDescription: string | null;
    status: SchoolInnovationChallengeStatus;
    maxEntries: number;
  }>
) {
  const existing = await prisma.schoolInnovationChallenge.findFirst({
    where: { id: challengeId, schoolId }
  });
  if (!existing) return null;
  return prisma.schoolInnovationChallenge.update({
    where: { id: challengeId },
    data
  });
}

export async function listPublicEnterpriseHighlights(schoolId: string, limit = 4) {
  const rows = await prisma.schoolEnterpriseProject.findMany({
    where: {
      schoolId,
      status: { in: ["ACTIVE", "COMPETING", "AWARDED"] }
    },
    orderBy: { createdAt: "desc" },
    take: limit
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    projectTypeLabel: projectTypeLabel(row.projectType),
    studentLead: row.studentLead,
    status: row.status,
    seekingSponsor: row.seekingSponsor
  }));
}
