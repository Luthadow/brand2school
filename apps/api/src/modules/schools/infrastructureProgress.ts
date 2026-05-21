/**
 * Infrastructure Progress System — verified category completion drives phase unlocks.
 * Schools never reset; completed phases stay completed permanently.
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

const PHASE_ITEM_DEFAULTS: Record<
  number,
  Array<{
    category: string;
    needed: number | string;
    priority: InfrastructureItemRecord["priority"];
    estimatedCostZar: number;
  }>
> = {
  1: [
    { category: "Toilets", needed: 20, priority: "Critical", estimatedCostZar: 180_000 },
    { category: "Water Tanks", needed: 2, priority: "Critical", estimatedCostZar: 45_000 },
    { category: "Sanitation", needed: 1, priority: "High", estimatedCostZar: 60_000 },
    { category: "Fencing", needed: "Full perimeter", priority: "High", estimatedCostZar: 95_000 },
    { category: "Lighting", needed: 15, priority: "Medium", estimatedCostZar: 35_000 }
  ],
  2: [
    { category: "Classrooms", needed: 12, priority: "High", estimatedCostZar: 420_000 },
    { category: "Desks", needed: 300, priority: "High", estimatedCostZar: 90_000 },
    { category: "Libraries", needed: 1, priority: "Medium", estimatedCostZar: 75_000 },
    { category: "Roofing", needed: 8, priority: "Critical", estimatedCostZar: 160_000 }
  ],
  3: [
    { category: "Computer Labs", needed: 1, priority: "High", estimatedCostZar: 250_000 },
    { category: "WiFi", needed: "Campus-wide", priority: "High", estimatedCostZar: 80_000 },
    { category: "Smart Classrooms", needed: 4, priority: "Medium", estimatedCostZar: 120_000 }
  ],
  4: [
    { category: "Sports Fields", needed: 1, priority: "Medium", estimatedCostZar: 200_000 },
    { category: "Nutrition", needed: 200, priority: "Critical", estimatedCostZar: 50_000 },
    { category: "Science Labs", needed: 1, priority: "High", estimatedCostZar: 180_000 }
  ],
  5: [
    { category: "Robotics Labs", needed: 1, priority: "Medium", estimatedCostZar: 300_000 },
    { category: "Solar Systems", needed: 1, priority: "High", estimatedCostZar: 220_000 },
    { category: "Innovation Hubs", needed: 1, priority: "Medium", estimatedCostZar: 350_000 }
  ]
};

function slugKey(phase: number, category: string): string {
  return `p${phase}-${category.toLowerCase().replace(/\s+/g, "-")}`;
}

function hashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 9973;
  return h;
}

function numericProgress(needed: number | string, current: number | string): number {
  if (typeof needed === "number" && typeof current === "number" && needed > 0) {
    return Math.min(100, Math.round((current / needed) * 100));
  }
  if (typeof needed === "string" && typeof current === "string") {
    if (current.toLowerCase().includes("full") || current === needed) return 100;
    if (current.toLowerCase().includes("half") || current.toLowerCase().includes("partial")) return 50;
    return 25;
  }
  return 0;
}

function defaultCurrent(
  schoolId: string,
  phase: number,
  category: string,
  needed: number | string,
  validSubmissions: number
): number | string {
  const seed = hashSeed(`${schoolId}:${phase}:${category}`);
  const boost = Math.min(40, Math.floor(validSubmissions / 20));
  if (typeof needed === "number") {
    const pct = Math.min(95, 15 + (seed % 50) + boost + (phase === 1 ? 10 : 0));
    return Math.max(0, Math.round((needed * pct) / 100));
  }
  if (pctFromSeed(seed, boost) >= 85) return "Full perimeter";
  if (pctFromSeed(seed, boost) >= 50) return "Half perimeter";
  return "Partial";
}

function pctFromSeed(seed: number, boost: number): number {
  return Math.min(100, 15 + (seed % 50) + boost);
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

export function defaultInfrastructureItems(schoolId: string, validSubmissions: number): InfrastructureItemRecord[] {
  const items: InfrastructureItemRecord[] = [];
  for (const [phaseStr, defs] of Object.entries(PHASE_ITEM_DEFAULTS)) {
    const phase = Number(phaseStr);
    for (const def of defs) {
      const current = defaultCurrent(schoolId, phase, def.category, def.needed, validSubmissions);
      const completionPercent = numericProgress(def.needed, current);
      const verificationStatus: VerificationStatus =
        completionPercent >= 100 ? "verified" : completionPercent >= 70 ? "pending" : "unverified";
      items.push({
        key: slugKey(phase, def.category),
        phase,
        category: def.category,
        needed: def.needed,
        current,
        completionPercent,
        verificationStatus,
        priority: def.priority,
        estimatedCostZar: def.estimatedCostZar,
        verifiedAt: verificationStatus === "verified" ? new Date().toISOString() : null
      });
    }
  }
  return items;
}

export function mergeInfrastructureItems(
  stored: InfrastructureItemRecord[] | null | undefined,
  schoolId: string,
  validSubmissions: number
): InfrastructureItemRecord[] {
  const defaults = defaultInfrastructureItems(schoolId, validSubmissions);
  if (!stored?.length) return defaults;
  const map = new Map(stored.map((i) => [i.key, i]));
  return defaults.map((d) => {
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

export function buildInfrastructureProfile(input: {
  schoolId: string;
  storedItems?: InfrastructureItemRecord[] | null;
  storedPhase?: number;
  phaseHistory?: Record<string, string>;
  validSubmissions: number;
}): InfrastructureProfile {
  let items = mergeInfrastructureItems(input.storedItems, input.schoolId, input.validSubmissions);
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
