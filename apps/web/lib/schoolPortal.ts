export type SchoolPortal = {
  school: {
    id: string;
    name: string;
    emisNumber: string;
    schoolCode: string;
    province: string;
    district: string;
    principalName: string;
    contactEmail: string | null;
    whatsappPhone: string;
    status: string;
    learnerCount: number;
    verificationStatus: string;
  };
  verification: {
    status: string;
    emisNumber: string | null;
    submittedAt: string | null;
    rejectionReason: string | null;
    canSubmit: boolean;
  };
  overview: {
    verifiedSubmissions: number;
    estimatedImpactZar: number;
    nationalScore: number;
    fundingBalanceZar: number;
    activeCampaigns: number;
    projectsInProgress: number;
    projectsCompleted: number;
    activeNeeds: number;
    targetReachedPercent: number;
    monthlyRank: number | null;
  };
  targets: Array<{
    id: string;
    name: string;
    brandName: string;
    category: string | null;
    infrastructureGoal: string | null;
    targetSubmissions: number;
    validSubmissions: number;
    percentToTarget: number;
    remainingToTarget: number;
    estimatedCompletionMonths: number;
  }>;
  needs: Array<{
    id: string;
    title: string;
    category: string;
    subcategory: string;
    urgency: string;
    description: string;
    learnerImpact: number;
    estimatedCostZar: number;
    progressPercent: number;
    status: string;
    submittedAt: string;
  }>;
  supporters: Array<{ name: string; type: string; submissions: number }>;
  projects: Array<{ id: string; title: string; stage: string; updatedAt: string }>;
  submissionsTrend: Array<{ label: string; count: number }>;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    type: string;
    createdAt: string;
    read: boolean;
  }>;
  gamification: {
    level: "bronze" | "silver" | "gold";
    label: string;
    badges: string[];
    nationalRank: number | null;
  };
  whatsapp: { phone: string; commands: string[] };
  development: {
    missionStatement: string;
    currentPhase: number;
    tier: number;
    tierLabel: string;
    tierDescription: string;
    phases: Array<{
      phase: number;
      title: string;
      focus: string;
      items: string[];
      status: "completed" | "active" | "locked";
      completedAt: string | null;
      progressPercent: number;
    }>;
    areaScores: Array<{ area: string; percent: number; status: string }>;
    annualCycle: { year: number; focus: string };
    nextAnnualCycle: { year: number; focus: string } | null;
    activeGoals: string[];
    phaseTransition: { completed: string; opened: string } | null;
    overallProgressPercent: number;
    nationalScore: number;
    phaseCompletionThreshold: number;
    infrastructure: {
      nationalScore: number;
      phaseCompletionThreshold: number;
      phases: Array<{
        phase: number;
        title: string;
        progressPercent: number;
        verifiedProgressPercent: number;
        isComplete: boolean;
        items: Array<{
          category: string;
          needed: number | string;
          current: number | string;
          completionPercent: number;
          verificationStatus: string;
          priority: string;
          estimatedCostZar: number;
        }>;
      }>;
    };
  };
  funding: {
    balanceZar: number;
    lifetimeGrossZar: number;
    contributionPerCodeZar: number;
    fundSplit: Record<string, number>;
    message: string;
    recent: Array<{
      id: string;
      grossZar: number;
      campaignName: string;
      createdAt: string;
    }>;
  };
  brandPartners: Array<{ brand: string; categories: string[] }>;
  annualCycles: Array<{ year: number; focus: string; phase: number }>;
};

export const NEED_CATEGORIES: Record<string, string[]> = {
  Infrastructure: ["Classrooms", "Roofing", "Fencing", "Lighting", "Water Tanks", "Toilets"],
  Education: ["Science Labs", "Libraries", "Textbooks", "Whiteboards"],
  Nutrition: ["Feeding Schemes", "Kitchens", "Food Gardens"],
  Technology: ["Computer Labs", "WiFi", "Coding Labs"],
  Sports: ["Sports Fields", "Equipment", "Changing Rooms"],
  Safety: ["Security", "Sanitation", "First Aid"]
};

export const PROJECT_STAGES = [
  { key: "target_achieved", label: "Target achieved" },
  { key: "verification", label: "Verification" },
  { key: "funding", label: "Funding" },
  { key: "contractor", label: "Contractor appointed" },
  { key: "construction", label: "Construction" },
  { key: "inspection", label: "Inspection" },
  { key: "completed", label: "Completed" }
] as const;

export function formatZar(amount: number): string {
  if (amount >= 1_000_000) return `R${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `R${Math.round(amount / 1_000)}k`;
  return `R${amount.toLocaleString("en-ZA")}`;
}
