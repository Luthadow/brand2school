export type PublicImpactKpi = {
  key: string;
  label: string;
  value: number;
  format: "count" | "percent";
  hint?: string;
};

export type FraudGovernanceBlock = {
  submissionsLastHour: number;
  submissionsLast24Hours: number;
  avgVerifiedPerHour7d: number;
  velocityRatio: number;
  status: "normal" | "elevated" | "high";
  statusLabel: string;
  fraudCleanRatePercent: number;
  verificationRatePercent: number;
  flaggedOrRejectedLast24h: number;
  duplicateAttemptsLast24h: number;
  openFraudFlags: number;
  provincesUnderReview: number;
};

export type InfrastructureCategoryRow = {
  category: string;
  progressPercent: number;
  schoolsCount: number;
  verifiedDeliveries: number;
};

export type PublicImpactDashboard = {
  updatedAt: string;
  positioning: string;
  kpis: PublicImpactKpi[];
  fraudGovernance: FraudGovernanceBlock;
  infrastructure: {
    categories: InfrastructureCategoryRow[];
    phaseMaturity: Array<{ phase: number; title: string; schools: number }>;
    averageNationalScore: number;
  };
  provinces: Array<{
    code: string;
    name: string;
    schools: number;
    verifiedParticipations: number;
    intensity: number;
  }>;
  ecosystemFunnel: Array<{ stage: string; count: number }>;
  liveCampaigns: number;
  governanceNotes: string[];
};

const TIMEOUT_MS = 8000;

export async function fetchPublicImpactDashboard(apiBase?: string): Promise<PublicImpactDashboard | null> {
  const base = apiBase ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  try {
    const res = await fetch(`${base}/api/v1/platform/impact`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicImpactDashboard;
  } catch {
    return null;
  }
}

export function emptyPublicImpactDashboard(): PublicImpactDashboard {
  return {
    updatedAt: new Date().toISOString(),
    positioning:
      "Brand2School is a governed education transformation ecosystem — we verify, track, measure, and report.",
    kpis: [],
    fraudGovernance: {
      submissionsLastHour: 0,
      submissionsLast24Hours: 0,
      avgVerifiedPerHour7d: 0,
      velocityRatio: 0,
      status: "normal",
      statusLabel: "Participation velocity within expected range.",
      fraudCleanRatePercent: 100,
      verificationRatePercent: 100,
      flaggedOrRejectedLast24h: 0,
      duplicateAttemptsLast24h: 0,
      openFraudFlags: 0,
      provincesUnderReview: 0
    },
    infrastructure: {
      categories: [],
      phaseMaturity: [],
      averageNationalScore: 0
    },
    provinces: [],
    ecosystemFunnel: [],
    liveCampaigns: 0,
    governanceNotes: []
  };
}
