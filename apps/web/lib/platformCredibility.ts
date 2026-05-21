export type PublicCredibilityKpi = {
  key: string;
  label: string;
  value: number;
  hint: string;
};

export type PublicCampaignPerformanceRow = {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  submissions: number;
  verificationRate: number;
  engagementRate: number;
  conversionRate: number;
  schoolsParticipating: number;
  isActive: boolean;
};

export type PlatformCredibilityPayload = {
  updatedAt: string;
  kpis: PublicCredibilityKpi[];
  campaignPerformance: PublicCampaignPerformanceRow[];
  fraudBlocked: number;
  protections: string[];
};

const TIMEOUT_MS = 3000;

export async function fetchPlatformCredibility(apiBase?: string): Promise<PlatformCredibilityPayload | null> {
  const base = apiBase ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  try {
    const res = await fetch(`${base}/api/v1/platform/credibility`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!res.ok) return null;
    return (await res.json()) as PlatformCredibilityPayload;
  } catch {
    return null;
  }
}

export function emptyPlatformCredibility(): PlatformCredibilityPayload {
  const kpis: PublicCredibilityKpi[] = [
    { key: "verifiedSubmissions", label: "Verified submissions", value: 0, hint: "Trust" },
    { key: "schoolsImpacted", label: "Schools impacted", value: 0, hint: "Social proof" },
    { key: "activeCampaigns", label: "Active campaigns", value: 0, hint: "Momentum" },
    { key: "activeBrands", label: "Active brand partners", value: 0, hint: "Ecosystem" },
    { key: "fraudBlocked", label: "Fraud blocked", value: 0, hint: "Integrity" },
    { key: "provincesReached", label: "Provinces reached", value: 0, hint: "National scale" },
    { key: "infrastructureMilestones", label: "Infrastructure milestones", value: 0, hint: "Real impact" },
    { key: "totalSubmissions", label: "Total participation events", value: 0, hint: "Activity" }
  ];
  return {
    updatedAt: new Date().toISOString(),
    kpis,
    campaignPerformance: [],
    fraudBlocked: 0,
    protections: []
  };
}
