import { prisma } from "../../lib/prisma.js";
import {
  buildSchoolDevelopmentProfile,
  serializeDevelopmentUpdate,
  type SchoolDevelopmentProfile
} from "./schoolDevelopment.js";
import {
  mergeInfrastructureItems,
  type InfrastructureItemRecord,
  type VerificationStatus
} from "./infrastructureProgress.js";
import { processInfrastructureGovernanceAlerts } from "./processInfrastructureGovernanceAlerts.js";

export type SchoolInfraSnapshot = {
  id: string;
  name: string;
  province: string;
  district: string;
  principalName: string;
  contactEmail: string | null;
  currentPhase: number;
  developmentTier: number;
  developmentScores: unknown;
  phaseHistory: unknown;
  infrastructureItems: unknown;
  annualCycleYear: number | null;
  annualCycleFocus: string | null;
};

export type InfrastructureItemPatch = {
  key: string;
  verificationStatus?: VerificationStatus;
  current?: number | string;
  completionPercent?: number;
  verifiedAt?: string | null;
};

export async function countValidSubmissionsForSchool(schoolId: string): Promise<number> {
  return prisma.submission.count({ where: { schoolId, state: "VALID" } });
}

export function applyInfrastructureItemPatches(
  schoolId: string,
  validSubmissions: number,
  storedItems: InfrastructureItemRecord[] | null | undefined,
  patches: InfrastructureItemPatch[]
): InfrastructureItemRecord[] {
  const merged = mergeInfrastructureItems(storedItems, schoolId, validSubmissions);
  if (patches.length === 0) return merged;

  const patchMap = new Map(patches.map((p) => [p.key, p]));
  return merged.map((item) => {
    const patch = patchMap.get(item.key);
    if (!patch) return item;

    const current = patch.current ?? item.current;
    const completionPercent = patch.completionPercent ?? item.completionPercent;
    const verificationStatus = patch.verificationStatus ?? item.verificationStatus;
    let verifiedAt = patch.verifiedAt !== undefined ? patch.verifiedAt : item.verifiedAt;

    if (verificationStatus === "verified" && completionPercent >= 100 && !verifiedAt) {
      verifiedAt = new Date().toISOString();
    }
    if (verificationStatus !== "verified") {
      verifiedAt = patch.verifiedAt !== undefined ? patch.verifiedAt : null;
    }

    return {
      ...item,
      current,
      completionPercent,
      verificationStatus,
      verifiedAt
    };
  });
}

export function schoolRecordToStored(school: SchoolInfraSnapshot) {
  return {
    currentPhase: school.currentPhase,
    developmentTier: school.developmentTier,
    developmentScores: (school.developmentScores as Record<string, number> | null) ?? undefined,
    phaseHistory: (school.phaseHistory as Record<string, string> | null) ?? undefined,
    infrastructureItems: (school.infrastructureItems as InfrastructureItemRecord[] | null) ?? undefined,
    annualCycleYear: school.annualCycleYear ?? undefined,
    annualCycleFocus: school.annualCycleFocus ?? undefined
  };
}

export type PersistInfrastructureResult = {
  changed: boolean;
  development: SchoolDevelopmentProfile;
  serialized: ReturnType<typeof serializeDevelopmentUpdate>;
  governanceNotified: number;
};

export async function persistSchoolInfrastructure(input: {
  school: SchoolInfraSnapshot;
  validSubmissions: number;
  itemPatches?: InfrastructureItemPatch[];
  adminPhase?: { currentPhase?: number; phaseHistory?: Record<string, string> };
  /** Portal: only notify after baseline exists. Admin: always true when saving edits. */
  notifyGovernance: boolean;
  actorId?: string;
  auditAction?: string;
  auditPayload?: Record<string, unknown>;
}): Promise<PersistInfrastructureResult> {
  const before = {
    currentPhase: input.school.currentPhase,
    phaseHistory: input.school.phaseHistory,
    infrastructureItems: input.school.infrastructureItems
  };

  const patchedItems =
    input.itemPatches && input.itemPatches.length > 0
      ? applyInfrastructureItemPatches(
          input.school.id,
          input.validSubmissions,
          input.school.infrastructureItems as InfrastructureItemRecord[] | null,
          input.itemPatches
        )
      : undefined;

  const stored = schoolRecordToStored(input.school);
  if (patchedItems) stored.infrastructureItems = patchedItems;
  if (input.adminPhase?.currentPhase != null) stored.currentPhase = input.adminPhase.currentPhase;
  if (input.adminPhase?.phaseHistory != null) stored.phaseHistory = input.adminPhase.phaseHistory;

  const development = buildSchoolDevelopmentProfile({
    schoolId: input.school.id,
    schoolName: input.school.name,
    validSubmissions: input.validSubmissions,
    stored
  });

  const serialized = serializeDevelopmentUpdate(development);

  const changed =
    input.school.currentPhase !== serialized.currentPhase ||
    input.school.developmentTier !== serialized.developmentTier ||
    JSON.stringify(input.school.infrastructureItems) !== JSON.stringify(serialized.infrastructureItems) ||
    JSON.stringify(input.school.phaseHistory) !== JSON.stringify(serialized.phaseHistory);

  if (changed) {
    await prisma.school.update({
      where: { id: input.school.id },
      data: {
        currentPhase: serialized.currentPhase,
        developmentTier: serialized.developmentTier,
        developmentScores: serialized.developmentScores,
        phaseHistory: serialized.phaseHistory,
        infrastructureItems: serialized.infrastructureItems,
        annualCycleYear: serialized.annualCycleYear,
        annualCycleFocus: serialized.annualCycleFocus
      }
    });
  }

  if (input.auditAction) {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.auditAction,
        targetType: "School",
        targetId: input.school.id,
        payload: (input.auditPayload ?? {}) as object
      }
    });
  }

  let governanceNotified = 0;
  const shouldNotify =
    input.notifyGovernance &&
    changed &&
    (input.school.infrastructureItems != null || (input.itemPatches?.length ?? 0) > 0);

  if (shouldNotify) {
    const result = await processInfrastructureGovernanceAlerts({
      school: {
        id: input.school.id,
        name: input.school.name,
        province: input.school.province,
        district: input.school.district,
        principalName: input.school.principalName,
        contactEmail: input.school.contactEmail
      },
      validSubmissions: input.validSubmissions,
      before,
      after: {
        currentPhase: serialized.currentPhase ?? development.currentPhase,
        phaseHistory: serialized.phaseHistory ?? {},
        infrastructureItems: serialized.infrastructureItems ?? development.infrastructure.items
      },
      afterDevelopment: development
    });
    governanceNotified = result.notified;
  }

  return { changed, development, serialized, governanceNotified };
}
