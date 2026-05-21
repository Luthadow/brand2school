/**
 * School Needs Engine — infrastructure intelligence per category.
 * Schools never "exit"; they progress, maintain, and upgrade within the ecosystem.
 */

import type { InfrastructureItemRecord } from "./infrastructureProgress.js";
import type { SchoolDevelopmentProfile } from "./schoolDevelopment.js";

export const NEED_LIFECYCLE_STATUSES = [
  "COMPLETE",
  "IN_PROGRESS",
  "ACTIVE",
  "MAINTENANCE_REQUIRED",
  "NEEDS_UPGRADE",
  "PENDING"
] as const;

export type NeedLifecycleStatus = (typeof NEED_LIFECYCLE_STATUSES)[number];

export type SchoolNeedEngineRow = {
  id: string;
  category: string;
  phase: number;
  status: NeedLifecycleStatus;
  statusLabel: string;
  progressPercent: number;
  verificationStatus: string;
  maintenanceDueAt: string | null;
  installedAt: string | null;
  priority: string;
  estimatedCostZar: number;
  ecosystemNote: string;
};

/** Default years before verified infrastructure enters maintenance / refresh eligibility. */
export const DEFAULT_MAINTENANCE_CYCLE_YEARS = 3;

const STATUS_LABELS: Record<NeedLifecycleStatus, string> = {
  COMPLETE: "Complete",
  IN_PROGRESS: "In Progress",
  ACTIVE: "Active",
  MAINTENANCE_REQUIRED: "Maintenance Required",
  NEEDS_UPGRADE: "Needs Upgrade",
  PENDING: "Pending"
};

function yearsSince(iso: string | null | undefined, now = new Date()): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return (now.getTime() - then) / (365.25 * 24 * 60 * 60 * 1000);
}

function computeMaintenanceDueAt(
  verifiedAt: string | null | undefined,
  cycleYears = DEFAULT_MAINTENANCE_CYCLE_YEARS
): string | null {
  if (!verifiedAt) return null;
  const due = new Date(verifiedAt);
  due.setFullYear(due.getFullYear() + cycleYears);
  return due.toISOString();
}

export function resolveNeedStatus(
  item: InfrastructureItemRecord,
  activePhase: number,
  now = new Date()
): { status: NeedLifecycleStatus; note: string } {
  const maintenanceDueAt = computeMaintenanceDueAt(item.verifiedAt);
  const ageYears = yearsSince(item.verifiedAt, now);

  if (
    item.verificationStatus === "verified" &&
    item.completionPercent >= 100 &&
    maintenanceDueAt &&
    now > new Date(maintenanceDueAt)
  ) {
    return {
      status: "MAINTENANCE_REQUIRED",
      note: "Verified infrastructure is due for refresh — school remains in the ecosystem upgrade pipeline."
    };
  }

  if (item.verificationStatus === "verified" && item.completionPercent >= 100) {
    if (item.phase < activePhase) {
      return {
        status: "NEEDS_UPGRADE",
        note: "Phase advanced — eligible for next-generation upgrades and expanded sponsorship tracks."
      };
    }
    return {
      status: "COMPLETE",
      note: "Verified complete — school progresses; no exit from the national network."
    };
  }

  if (item.phase === activePhase && item.completionPercent >= 40) {
    return {
      status: item.verificationStatus === "verified" ? "ACTIVE" : "IN_PROGRESS",
      note: "Active transformation work in current maturity phase."
    };
  }

  if (item.completionPercent > 0) {
    return {
      status: "IN_PROGRESS",
      note: "Intervention in progress — tracked for ESG and infrastructure intelligence."
    };
  }

  if (item.phase > activePhase) {
    return {
      status: "PENDING",
      note: "Unlocks when prior maturity phases reach verified thresholds."
    };
  }

  return {
    status: "PENDING",
    note: ageYears != null && ageYears > 0 ? "Baseline assessment pending." : "Awaiting verification and funding alignment."
  };
}

export function buildSchoolNeedsEngine(profile: SchoolDevelopmentProfile): SchoolNeedEngineRow[] {
  const items = profile.infrastructure.items;
  const activePhase = profile.currentPhase;

  return items.map((item) => {
    const { status, note } = resolveNeedStatus(item, activePhase);
    return {
      id: item.key,
      category: item.category,
      phase: item.phase,
      status,
      statusLabel: STATUS_LABELS[status],
      progressPercent: item.completionPercent,
      verificationStatus: item.verificationStatus,
      installedAt: item.verifiedAt ?? null,
      maintenanceDueAt: computeMaintenanceDueAt(item.verifiedAt),
      priority: item.priority,
      estimatedCostZar: item.estimatedCostZar,
      ecosystemNote: note
    };
  });
}

export function summarizeNeedsEngine(rows: SchoolNeedEngineRow[]): {
  complete: number;
  inProgress: number;
  maintenanceRequired: number;
  pending: number;
} {
  return {
    complete: rows.filter((r) => r.status === "COMPLETE").length,
    inProgress: rows.filter((r) => r.status === "IN_PROGRESS" || r.status === "ACTIVE").length,
    maintenanceRequired: rows.filter((r) => r.status === "MAINTENANCE_REQUIRED").length,
    pending: rows.filter((r) => r.status === "PENDING").length
  };
}
