/**
 * Infrastructure Progress System — verified category completion drives phase unlocks.
 * Schools never reset; completed phases stay completed permanently.
 * Unverified rows stay at zero until governance verifies (no synthetic progress).
 */

import { DEVELOPMENT_PHASES } from "./schoolDevelopment.js";

export const PHASE_COMPLETION_THRESHOLD = 80;

export type VerificationStatus = "unverified" | "pending" | "verified";

export type InfrastructureItemRecord = {
  key: string;
  phase: number;
  category: string;
  needed: number | string;
  current: number | string;
  completionPercent: number;
  verificationStatus: VerificationStatus;
  priority: "Critical" | "High" | "Medium" | "Long-Term";
  estimatedCostZar: number;
  verifiedAt?: string | null;
};

export type PhaseInfrastructureView = {
  phase: number;
  title: string;
  progressPercent: number;
  verifiedProgressPercent: number;
  isComplete: boolean;
  items: InfrastructureItemRecord[];
};

export type InfrastructureProfile = {
  items: InfrastructureItemRecord[];
  phases: PhaseInfrastructureView[];
  nationalScore: number;
  activePhase: number;
  phaseCompletionThreshold: number;
};

/** Planning catalog — targets only; progress starts at zero until verified. */
export const PHASE_ITEM_CATALOG: Record<
  number,
  Array<{
    category: string;
    needed: number | string;
    priority: InfrastructureItemRecord["priority"];
    estimatedCostZar: number;
  }>
> = {
  1: [
    { category: "Toilets", needed: 0, priority: "Critical", estimatedCostZar: 0 },
    { category: "Water Tanks", needed: 0, priority: "Critical", estimatedCostZar: 0 },
    { category: "Sanitation", needed: 0, priority: "High", estimatedCostZar: 0 },
    { category: "Fencing", needed: "Not assessed", priority: "High", estimatedCostZar: 0 },
    { category: "Lighting", needed: 0, priority: "Medium", estimatedCostZar: 0 }
  ],
  2: [
    { category: "Classrooms", needed: 0, priority: "High", estimatedCostZar: 0 },
    { category: "Desks", needed: 0, priority: "High", estimatedCostZar: 0 },
    { category: "Libraries", needed: 0, priority: "Medium", estimatedCostZar: 0 },
    { category: "Roofing", needed: 0, priority: "Critical", estimatedCostZar: 0 }
  ],
  3: [
    { category: "Computer Labs", needed: 0, priority: "High", estimatedCostZar: 0 },
    { category: "WiFi", needed: "Not assessed", priority: "High", estimatedCostZar: 0 },
    { category: "Smart Classrooms", needed: 0, priority: "Medium", estimatedCostZar: 0 }
  ],
  4: [
    { category: "Sports Fields", needed: 0, priority: "Medium", estimatedCostZar: 0 },
    { category: "Nutrition", needed: 0, priority: "Critical", estimatedCostZar: 0 },
    { category: "Science Labs", needed: 0, priority: "High", estimatedCostZar: 0 }
  ],
  5: [
    { category: "Robotics Labs", needed: 0, priority: "Medium", estimatedCostZar: 0 },
    { category: "Solar Systems", needed: 0, priority: "High", estimatedCostZar: 0 },
    { category: "Innovation Hubs", needed: 0, priority: "Medium", estimatedCostZar: 0 }
  ]
};

function slugKey(phase: number, category: string): string {
  return `p${phase}-${category.toLowerCase().replace(/\s+/g, "-")}`;
}

function zeroCurrent(needed: number | string): number | string {
  return typeof needed === "number" ? 0 : "Not started";
}

function numericProgress(needed: number | string, current: number | string): number {
  if (typeof needed === "number" && typeof current === "number" && needed > 0) {
    return Math.min(100, Math.round((current / needed) * 100));
  }
  if (typeof needed === "string" && typeof current === "string") {
    if (current.toLowerCase().includes("full") || current === needed) return 100;
    if (current.toLowerCase().includes("half") || current.toLowerCase().includes("partial")) return 50;
    return 0;
  }
  return 0;
}

/** Drop legacy synthetic progress saved before live-only dashboards. */
export function sanitizeInfrastructureItem(item: InfrastructureItemRecord): InfrastructureItemRecord {
  if (item.verificationStatus === "verified" && item.verifiedAt) {
    const completionPercent =
      item.completionPercent ?? numericProgress(item.needed, item.current);
    return { ...item, completionPercent };
  }
  const current = zeroCurrent(item.needed);
  return {
    ...item,
    current,
    completionPercent: 0,
    verificationStatus: "unverified",
    verifiedAt: null
  };
}

export function catalogInfrastructureItems(): InfrastructureItemRecord[] {
  const items: InfrastructureItemRecord[] = [];
  for (const [phaseStr, defs] of Object.entries(PHASE_ITEM_CATALOG)) {
    const phase = Number(phaseStr);
    for (const def of defs) {
      const current = zeroCurrent(def.needed);
      items.push({
        key: slugKey(phase, def.category),
        phase,
        category: def.category,
        needed: def.needed,
        current,
        completionPercent: 0,
        verificationStatus: "unverified",
        priority: def.priority,
        estimatedCostZar: def.estimatedCostZar,
        verifiedAt: null
      });
    }
  }
  return items;
}

export function mergeInfrastructureItems(
  stored: InfrastructureItemRecord[] | null | undefined,
  _schoolId: string,
  _validSubmissions: number
): InfrastructureItemRecord[] {
  const catalog = catalogInfrastructureItems();
  if (!stored?.length) return catalog;
  const map = new Map(stored.map((i) => [i.key, sanitizeInfrastructureItem(i)]));
  return catalog.map((d) => {
    const existing = map.get(d.key);
    if (!existing) return d;
    const completionPercent =
      existing.completionPercent ??
      numericProgress(existing.needed ?? d.needed, existing.current ?? d.current);
    return {
      ...d,
      ...existing,
      completionPercent,
      verificationStatus: existing.verificationStatus ?? d.verificationStatus
    };
  });
}

function verifiedCompletionPercent(item: InfrastructureItemRecord): number {
  if (item.verificationStatus !== "verified") return 0;
  return item.completionPercent;
}

function phaseVerifiedAverage(items: InfrastructureItemRecord[]): number {
  if (items.length === 0) return 0;
  const sum = items.reduce((s, i) => s + verifiedCompletionPercent(i), 0);
  return Math.round(sum / items.length);
}

function phaseRawAverage(items: InfrastructureItemRecord[]): number {
  if (items.length === 0) return 0;
  return Math.round(items.reduce((s, i) => s + i.completionPercent, 0) / items.length);
}

export function buildInfrastructureProfile(input: {
  schoolId: string;
  storedItems?: InfrastructureItemRecord[] | null;
  storedPhase?: number;
  phaseHistory?: Record<string, string>;
  validSubmissions: number;
}): InfrastructureProfile {
  const items = mergeInfrastructureItems(input.storedItems, input.schoolId, input.validSubmissions);
  const phaseHistory = { ...(input.phaseHistory ?? {}) };

  let activePhase = input.storedPhase ?? 1;

  const buildPhaseViews = (): PhaseInfrastructureView[] =>
    DEVELOPMENT_PHASES.map((def) => {
      const phaseItems = items.filter((i) => i.phase === def.phase);
      const verifiedProgressPercent = phaseVerifiedAverage(phaseItems);
      const progressPercent = phaseRawAverage(phaseItems);
      const isComplete =
        def.phase < activePhase ||
        verifiedProgressPercent >= PHASE_COMPLETION_THRESHOLD ||
        Boolean(phaseHistory[String(def.phase)]);
      return {
        phase: def.phase,
        title: def.title,
        progressPercent: def.phase < activePhase ? 100 : progressPercent,
        verifiedProgressPercent: def.phase < activePhase ? 100 : verifiedProgressPercent,
        isComplete,
        items: phaseItems
      };
    });

  let phases = buildPhaseViews();
  let active = phases.find((p) => p.phase === activePhase);

  if (active && active.verifiedProgressPercent >= PHASE_COMPLETION_THRESHOLD && activePhase < 5) {
    phaseHistory[String(activePhase)] = phaseHistory[String(activePhase)] ?? new Date().toISOString();
    activePhase += 1;
    phases = buildPhaseViews();
    active = phases.find((p) => p.phase === activePhase);
  }

  const nationalScore = Math.round(
    phases.reduce((sum, p) => sum + (p.isComplete ? 100 : p.verifiedProgressPercent), 0) / phases.length
  );

  return {
    items,
    phases,
    nationalScore,
    activePhase,
    phaseCompletionThreshold: PHASE_COMPLETION_THRESHOLD
  };
}

export function serializeInfrastructureForStorage(profile: InfrastructureProfile): {
  infrastructureItems: InfrastructureItemRecord[];
  currentPhase: number;
  phaseHistory: Record<string, string>;
} {
  const phaseHistory: Record<string, string> = {};
  for (const p of profile.phases) {
    if (p.isComplete) {
      phaseHistory[String(p.phase)] = new Date().toISOString();
    }
  }
  return {
    infrastructureItems: profile.items,
    currentPhase: profile.activePhase,
    phaseHistory
  };
}
