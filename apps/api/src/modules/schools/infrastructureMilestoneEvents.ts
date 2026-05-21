import { DEVELOPMENT_PHASES } from "./schoolDevelopment.js";
import { buildSchoolNeedsEngine, type SchoolNeedEngineRow } from "./schoolNeedsEngine.js";
import type { InfrastructureItemRecord } from "./infrastructureProgress.js";
import { buildSchoolDevelopmentProfile, type SchoolDevelopmentProfile } from "./schoolDevelopment.js";

export type InfrastructureMilestoneEvent =
  | {
      type: "PHASE_COMPLETED";
      milestoneKey: string;
      phase: number;
      phaseTitle: string;
      verifiedProgressPercent: number;
      nextPhase: number | null;
      nextPhaseTitle: string | null;
    }
  | {
      type: "MAINTENANCE_REQUIRED";
      milestoneKey: string;
      phase: number;
      category: string;
      maintenanceDueAt: string;
    }
  | {
      type: "CATEGORY_VERIFIED";
      milestoneKey: string;
      phase: number;
      category: string;
    };

function phaseTitle(phase: number): string {
  return DEVELOPMENT_PHASES.find((p) => p.phase === phase)?.title ?? `Phase ${phase}`;
}

export function detectInfrastructureMilestoneEvents(input: {
  skipCategoryVerified?: boolean;
  beforePhaseHistory: Record<string, string>;
  afterPhaseHistory: Record<string, string>;
  beforePhase: number;
  afterPhase: number;
  beforeItems: InfrastructureItemRecord[];
  afterItems: InfrastructureItemRecord[];
  afterDevelopment: SchoolDevelopmentProfile;
}): InfrastructureMilestoneEvent[] {
  const events: InfrastructureMilestoneEvent[] = [];

  const newlyCompletedPhases = Object.keys(input.afterPhaseHistory).filter(
    (key) => !input.beforePhaseHistory[key]
  );

  for (const key of newlyCompletedPhases) {
    const phase = Number(key);
    if (!Number.isFinite(phase) || phase < 1 || phase > 5) continue;
    const phaseView = input.afterDevelopment.infrastructure.phases.find((p) => p.phase === phase);
    const nextPhase = phase < input.afterPhase ? input.afterPhase : null;
    events.push({
      type: "PHASE_COMPLETED",
      milestoneKey: `phase-complete:${phase}`,
      phase,
      phaseTitle: phaseTitle(phase),
      verifiedProgressPercent: phaseView?.verifiedProgressPercent ?? 100,
      nextPhase: nextPhase && nextPhase > phase ? nextPhase : null,
      nextPhaseTitle: nextPhase && nextPhase > phase ? phaseTitle(nextPhase) : null
    });
  }

  if (input.afterPhase > input.beforePhase && newlyCompletedPhases.length === 0) {
    const completedPhase = input.afterPhase - 1;
    const milestoneKey = `phase-advanced:${completedPhase}-to-${input.afterPhase}`;
    const phaseView = input.afterDevelopment.infrastructure.phases.find((p) => p.phase === completedPhase);
    events.push({
      type: "PHASE_COMPLETED",
      milestoneKey,
      phase: completedPhase,
      phaseTitle: phaseTitle(completedPhase),
      verifiedProgressPercent: phaseView?.verifiedProgressPercent ?? 100,
      nextPhase: input.afterPhase,
      nextPhaseTitle: phaseTitle(input.afterPhase)
    });
  }

  if (!input.skipCategoryVerified) {
  const beforeByKey = new Map(input.beforeItems.map((i) => [i.key, i]));
  for (const item of input.afterItems) {
    const before = beforeByKey.get(item.key);
    const wasVerified =
      before?.verificationStatus === "verified" && (before.completionPercent ?? 0) >= 100;
    const isVerified = item.verificationStatus === "verified" && item.completionPercent >= 100;
    if (isVerified && !wasVerified) {
      events.push({
        type: "CATEGORY_VERIFIED",
        milestoneKey: `category-verified:${item.key}`,
        phase: item.phase,
        category: item.category
      });
    }
  }
  }

  return events;
}

export function detectMaintenanceGovernanceEvents(
  beforeRows: SchoolNeedEngineRow[],
  afterRows: SchoolNeedEngineRow[]
): InfrastructureMilestoneEvent[] {
  const beforeMaint = new Set(
    beforeRows.filter((r) => r.status === "MAINTENANCE_REQUIRED").map((r) => r.id)
  );
  const events: InfrastructureMilestoneEvent[] = [];
  for (const row of afterRows) {
    if (row.status !== "MAINTENANCE_REQUIRED" || beforeMaint.has(row.id)) continue;
    if (!row.maintenanceDueAt) continue;
    events.push({
      type: "MAINTENANCE_REQUIRED",
      milestoneKey: `maintenance:${row.id}`,
      phase: row.phase,
      category: row.category,
      maintenanceDueAt: row.maintenanceDueAt
    });
  }
  return events;
}

export function buildNeedsRowsFromStored(input: {
  schoolId: string;
  schoolName: string;
  validSubmissions: number;
  currentPhase: number;
  phaseHistory: Record<string, string>;
  infrastructureItems: InfrastructureItemRecord[];
}): SchoolNeedEngineRow[] {
  const profile = buildSchoolDevelopmentProfile({
    schoolId: input.schoolId,
    schoolName: input.schoolName,
    validSubmissions: input.validSubmissions,
    stored: {
      currentPhase: input.currentPhase,
      phaseHistory: input.phaseHistory,
      infrastructureItems: input.infrastructureItems
    }
  });
  return buildSchoolNeedsEngine(profile);
}
