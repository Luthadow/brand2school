/**
 * Continuous school development ecosystem — phased roadmap, area scores, tiers, annual cycles.
 * Phase progress is driven by verified infrastructure completion (see infrastructureProgress.ts).
 */

import {
  buildInfrastructureProfile,
  type InfrastructureItemRecord,
  PHASE_COMPLETION_THRESHOLD
} from "./infrastructureProgress.js";

export const DEVELOPMENT_PHASES = [
  {
    phase: 1,
    title: "Critical Needs",
    focus: "Safety, dignity, and basic services",
    items: ["Toilets", "Water", "Sanitation", "Fencing", "Electricity"],
    areas: ["Sanitation", "Infrastructure"]
  },
  {
    phase: 2,
    title: "Learning Environment",
    focus: "Spaces where teaching and learning thrive",
    items: ["Classrooms", "Desks", "Libraries", "Roofing", "Repairs"],
    areas: ["Classrooms", "Infrastructure"]
  },
  {
    phase: 3,
    title: "Digital Access",
    focus: "Connectivity and modern learning tools",
    items: ["Computer Labs", "WiFi", "Smart Classrooms", "Projectors"],
    areas: ["Technology"]
  },
  {
    phase: 4,
    title: "Learner Development",
    focus: "Holistic learner growth and wellbeing",
    items: ["Sports Fields", "Nutrition", "Science Labs", "Wellness Rooms"],
    areas: ["Sports", "Nutrition", "Science"]
  },
  {
    phase: 5,
    title: "Future Readiness",
    focus: "Innovation, sustainability, and leadership",
    items: ["Robotics Labs", "Coding Centers", "Solar Systems", "Innovation Hubs", "Entrepreneurship"],
    areas: ["Technology", "Innovation", "Sustainability"]
  }
] as const;

export const DEVELOPMENT_AREAS = [
  "Sanitation",
  "Classrooms",
  "Technology",
  "Sports",
  "Nutrition",
  "Science",
  "Innovation",
  "Sustainability"
] as const;

export const SCHOOL_TIERS = [
  { tier: 1, label: "Emergency Needs", description: "Stabilising critical infrastructure" },
  { tier: 2, label: "Core Infrastructure", description: "Building reliable learning foundations" },
  { tier: 3, label: "Modernization", description: "Upgrading facilities and access" },
  { tier: 4, label: "Innovation Ready", description: "STEM, digital, and learner programmes" },
  { tier: 5, label: "Future Smart School", description: "National model for educational excellence" }
] as const;

export const ANNUAL_CYCLES = [
  { year: 2026, focus: "Safety & Sanitation", phase: 1 },
  { year: 2027, focus: "Digital Access", phase: 3 },
  { year: 2028, focus: "Sports Infrastructure", phase: 4 },
  { year: 2029, focus: "STEM Development", phase: 5 }
] as const;

export type PhaseStatus = "completed" | "active" | "locked";

export type DevelopmentPhaseView = {
  phase: number;
  title: string;
  focus: string;
  items: string[];
  status: PhaseStatus;
  completedAt: string | null;
  progressPercent: number;
};

export type AreaScore = {
  area: string;
  percent: number;
  status: "strong" | "progressing" | "starting";
};

export type SchoolDevelopmentProfile = {
  missionStatement: string;
  currentPhase: number;
  tier: number;
  tierLabel: string;
  tierDescription: string;
  phases: DevelopmentPhaseView[];
  areaScores: AreaScore[];
  infrastructure: ReturnType<typeof buildInfrastructureProfile>;
  nationalScore: number;
  phaseCompletionThreshold: number;
  annualCycle: { year: number; focus: string };
  nextAnnualCycle: { year: number; focus: string } | null;
  activeGoals: string[];
  phaseTransition: { completed: string; opened: string } | null;
  overallProgressPercent: number;
};

type StoredDevelopment = {
  currentPhase?: number;
  developmentTier?: number;
  developmentScores?: Record<string, number>;
  phaseHistory?: Record<string, string>;
  annualCycleYear?: number;
  annualCycleFocus?: string;
  infrastructureItems?: InfrastructureItemRecord[];
};

function zeroAreaScores(): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const area of DEVELOPMENT_AREAS) scores[area] = 0;
  return scores;
}

function scoresFromInfrastructure(
  infrastructure: ReturnType<typeof buildInfrastructureProfile>
): Record<string, number> {
  const scores = zeroAreaScores();
  for (const phaseView of infrastructure.phases) {
    const def = DEVELOPMENT_PHASES.find((d) => d.phase === phaseView.phase);
    if (!def) continue;
    const pct = phaseView.isComplete ? 100 : phaseView.verifiedProgressPercent;
    for (const area of def.areas) {
      if (area in scores) scores[area] = Math.max(scores[area], pct);
    }
  }
  return scores;
}

function applyPhaseProgress(
  scores: Record<string, number>,
  currentPhase: number,
  phaseHistory: Record<string, string>
): Record<string, number> {
  const updated = { ...scores };
  for (let p = 1; p < currentPhase; p++) {
    const def = DEVELOPMENT_PHASES[p - 1];
    for (const area of def.areas) {
      if (area in updated) updated[area] = Math.max(updated[area], 100);
    }
  }
  if (phaseHistory[String(currentPhase)]) {
    const def = DEVELOPMENT_PHASES[currentPhase - 1];
    for (const area of def.areas) {
      if (area in updated) updated[area] = Math.min(100, Math.max(updated[area], 75));
    }
  }
  return updated;
}

function computeTier(currentPhase: number, avgScore: number): number {
  if (currentPhase >= 5 && avgScore >= 85) return 5;
  if (currentPhase >= 4 && avgScore >= 70) return 4;
  if (currentPhase >= 3 && avgScore >= 55) return 3;
  if (currentPhase >= 2 && avgScore >= 40) return 2;
  return 1;
}

export function buildSchoolDevelopmentProfile(input: {
  schoolId: string;
  schoolName: string;
  validSubmissions: number;
  stored?: StoredDevelopment | null;
}): SchoolDevelopmentProfile {
  const stored = input.stored ?? {};
  const phaseHistory = stored.phaseHistory ?? {};

  const infrastructure = buildInfrastructureProfile({
    schoolId: input.schoolId,
    storedItems: stored.infrastructureItems,
    storedPhase: stored.currentPhase,
    phaseHistory,
    validSubmissions: input.validSubmissions
  });

  let currentPhase = infrastructure.activePhase;

  let scores = scoresFromInfrastructure(infrastructure);
  scores = applyPhaseProgress(scores, currentPhase, phaseHistory);

  const phases: DevelopmentPhaseView[] = DEVELOPMENT_PHASES.map((def) => {
    const infraPhase = infrastructure.phases.find((p) => p.phase === def.phase);
    const progressPercent = infraPhase?.progressPercent ?? (def.phase < currentPhase ? 100 : 0);
    let status: PhaseStatus = "locked";
    if (def.phase < currentPhase || infraPhase?.isComplete) status = "completed";
    else if (def.phase === currentPhase) status = "active";
    return {
      phase: def.phase,
      title: def.title,
      focus: def.focus,
      items: [...def.items],
      status,
      completedAt: phaseHistory[String(def.phase)] ?? (status === "completed" ? new Date().toISOString() : null),
      progressPercent
    };
  });

  const areaScores: AreaScore[] = DEVELOPMENT_AREAS.map((area) => {
    const percent = scores[area] ?? 0;
    return {
      area,
      percent,
      status: percent >= 80 ? "strong" : percent >= 45 ? "progressing" : "starting"
    };
  });

  const avgScore = Math.round(areaScores.reduce((s, a) => s + a.percent, 0) / areaScores.length);
  const tier = computeTier(currentPhase, avgScore);
  const tierMeta = SCHOOL_TIERS[tier - 1] ?? SCHOOL_TIERS[0];

  const year = new Date().getFullYear();
  const annual =
    ANNUAL_CYCLES.find((c) => c.year === (stored.annualCycleYear ?? year)) ??
    ANNUAL_CYCLES.find((c) => c.year === year) ??
    ANNUAL_CYCLES[0];
  const nextAnnual = ANNUAL_CYCLES.find((c) => c.year === annual.year + 1) ?? null;

  const completedPhase = phases.find((p) => p.status === "completed" && p.phase === currentPhase - 1);
  const openedPhase = phases.find((p) => p.status === "active");

  const activeGoals: string[] = [];
  if (openedPhase) {
    activeGoals.push(
      `${openedPhase.title}: reach ${PHASE_COMPLETION_THRESHOLD}% verified completion to unlock next phase`
    );
    const activeItems = infrastructure.phases.find((p) => p.phase === currentPhase)?.items ?? [];
    const lowest = [...activeItems].sort((a, b) => a.completionPercent - b.completionPercent)[0];
    if (lowest) {
      activeGoals.push(`${lowest.category}: ${lowest.completionPercent}% (${lowest.verificationStatus})`);
    }
  }
  activeGoals.push(`${annual.focus} (${annual.year} national cycle)`);
  if (areaScores.some((a) => a.percent < 100)) {
    const lowest = [...areaScores].sort((a, b) => a.percent - b.percent)[0];
    activeGoals.push(`Grow ${lowest.area} from ${lowest.percent}% → next milestone`);
  }

  return {
    missionStatement: "Building the future of South African education — progressive development, not one-off relief.",
    currentPhase,
    tier,
    tierLabel: tierMeta.label,
    tierDescription: tierMeta.description,
    phases,
    areaScores,
    infrastructure,
    nationalScore: infrastructure.nationalScore,
    phaseCompletionThreshold: PHASE_COMPLETION_THRESHOLD,
    annualCycle: { year: annual.year, focus: stored.annualCycleFocus ?? annual.focus },
    nextAnnualCycle: nextAnnual ? { year: nextAnnual.year, focus: nextAnnual.focus } : null,
    activeGoals,
    phaseTransition:
      completedPhase && openedPhase
        ? {
            completed: `Phase ${completedPhase.phase} Completed — ${completedPhase.title}`,
            opened: `Phase ${openedPhase.phase} Opened — ${openedPhase.title}`
          }
        : null,
    overallProgressPercent: avgScore
  };
}

export function serializeDevelopmentUpdate(profile: SchoolDevelopmentProfile): StoredDevelopment {
  const phaseHistory: Record<string, string> = {};
  for (const p of profile.phases) {
    if (p.completedAt) phaseHistory[String(p.phase)] = p.completedAt;
  }
  for (const p of profile.infrastructure.phases) {
    if (p.isComplete) phaseHistory[String(p.phase)] = phaseHistory[String(p.phase)] ?? new Date().toISOString();
  }
  const scores: Record<string, number> = {};
  for (const a of profile.areaScores) scores[a.area] = a.percent;
  return {
    currentPhase: profile.currentPhase,
    developmentTier: profile.tier,
    developmentScores: scores,
    phaseHistory,
    infrastructureItems: profile.infrastructure.items,
    annualCycleYear: profile.annualCycle.year,
    annualCycleFocus: profile.annualCycle.focus
  };
}
