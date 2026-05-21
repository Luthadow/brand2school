import type { BrandAnalytics } from "./analytics";

export type PortalCampaign = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "pending" | "completed" | "paused";
  category: string | null;
  infrastructureGoal: string | null;
  targetSubmissions: number;
  validSubmissions: number;
  provinces: string[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

export type SchoolNeed = {
  id: string;
  name: string;
  province: string;
  district: string;
  learnerCount: number;
  priorityNeed: string;
  estimatedCostZar: number;
  progressPercent: number;
  verificationStatus: string;
  imageCategory: string;
};

export type ImpactPipelineItem = {
  id: string;
  schoolName: string;
  codeValue: string;
  stage:
    | "submitted"
    | "verified"
    | "linked"
    | "milestone"
    | "approved"
    | "started"
    | "completed";
  campaignName: string;
  province: string;
  updatedAt: string;
};

export type BrandPortal = {
  brand: { id: string; name: string };
  overview: {
    totalSubmissions: number;
    schoolsSupported: number;
    provincesReached: number;
    infrastructureProjectsFunded: number;
    activeCampaigns: number;
    verifiedSubmissions: number;
    verificationRate: number;
    monthlyGrowthPercent: number;
    estimatedLivesImpacted: number;
    impactValueZar: number;
  };
  analytics: BrandAnalytics;
  campaigns: PortalCampaign[];
  schoolNeeds: SchoolNeed[];
  impactPipeline: ImpactPipelineItem[];
  financials: {
    fundsAllocatedZar: number;
    fundsUsedZar: number;
    remainingTargetZar: number;
    verifiedExpensesZar: number;
    platformOperationalZar?: number;
    transformationPoolCommittedZar?: number;
    transformationPoolUsedZar?: number;
    projects: Array<{ name: string; budgetZar: number; spentZar: number; status: string }>;
  };
  media: Array<{
    id: string;
    title: string;
    schoolName: string;
    province: string;
    type: string;
    excerpt: string;
    imageCategory: string;
    publishedAt: string;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    type: string;
    createdAt: string;
    read: boolean;
  }>;
};

export const IMPACT_STAGES = [
  { key: "submitted", label: "Code Submitted" },
  { key: "verified", label: "Code Verified" },
  { key: "linked", label: "Linked to School" },
  { key: "milestone", label: "Milestone Reached" },
  { key: "approved", label: "Infrastructure Approved" },
  { key: "started", label: "Project Started" },
  { key: "completed", label: "Project Completed" }
] as const;

export const NEED_CATEGORIES = [
  "Classrooms",
  "Toilets",
  "Feeding Schemes",
  "Sports Fields",
  "Computer Labs",
  "Libraries",
  "Science Labs",
  "Safety & Wellness",
  "Solar Power"
] as const;

export function formatZar(amount: number): string {
  if (amount >= 1_000_000) return `R${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `R${Math.round(amount / 1_000)}k`;
  return `R${amount.toLocaleString("en-ZA")}`;
}

export function campaignStatusLabel(status: PortalCampaign["status"]): string {
  const map: Record<PortalCampaign["status"], string> = {
    active: "Active",
    pending: "Pending",
    completed: "Completed",
    paused: "Paused"
  };
  return map[status];
}
