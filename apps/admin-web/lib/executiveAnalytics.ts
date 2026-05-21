export type ExecutiveKpi = {
  key: string;
  label: string;
  value: number;
  format: "count" | "percent";
  trendPercent?: number;
};

export type PlatformExecutiveAnalytics = {
  generatedAt: string;
  kpis: ExecutiveKpi[];
  submissionTrend: {
    daily: Array<{ period: string; verified: number; total: number }>;
    weekly: Array<{ period: string; verified: number; total: number }>;
    monthly: Array<{ period: string; verified: number; total: number }>;
  };
  infrastructureProgress: Array<{
    category: string;
    progressPercent: number;
    schoolsCount: number;
    verifiedDeliveries: number;
  }>;
  provinces: Array<{ code: string; name: string; submissions: number; schools: number; intensity: number }>;
  brandRankings: Array<{
    rank: number;
    brandId: string;
    brandName: string;
    validSubmissions: number;
    schoolsReached: number;
    impactScore: number;
  }>;
  funnel: Array<{ stage: string; count: number }>;
  channelMix: Array<{ channel: string; count: number; sharePercent: number }>;
  fraudTrend: Array<{ period: string; blocked: number; duplicates: number; flagged: number }>;
  participationTrend: Array<{ period: string; activeParticipants: number; repeatParticipants: number }>;
  campaignPerformance: Array<{
    id: string;
    name: string;
    brandName: string;
    submissions: number;
    verificationRate: number;
    fraudRate: number;
    engagementRate: number;
    conversionRate: number;
  }>;
  liveFeed: Array<{ message: string; createdAt: string }>;
  trust: {
    fraudAttemptsBlocked: number;
    duplicateCodesRejected: number;
    invalidCodesRejected: number;
    flaggedSubmissions: number;
    auditEventsLogged: number;
    fraudByOutcome: Array<{ outcome: string; count: number }>;
  };
};
