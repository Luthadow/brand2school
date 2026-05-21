export type ProvinceMetric = {

  code: string;

  name: string;

  schools: number;

  learners: number;

  submissions: number;

  intensity: number;

};



export type CampaignMetric = {

  id: string;

  name: string;

  brandName: string;

  isActive: boolean;

  submissions: number;

  validSubmissions: number;

  schoolsReached: number;

  learnersReached: number;

  codeUtilization: number;

  startsAt: string;

  endsAt: string;

};



export type BrandTrustMetrics = {

  fraudAttemptsBlocked: number;

  duplicateCodesRejected: number;

  invalidCodesRejected: number;

  flaggedSubmissions: number;

  auditEventsLogged: number;

  protectionActive: boolean;

  protections: string[];

  recentAuditEvents: Array<{

    action: string;

    targetType: string;

    createdAt: string;

    summary: string;

  }>;

  fraudByOutcome: Array<{ outcome: string; count: number }>;

};



export type TrendPoint = {

  period: string;

  verified: number;

  total: number;

};



export type SubmissionTrendSeries = {

  daily: TrendPoint[];

  weekly: TrendPoint[];

  monthly: TrendPoint[];

};



export type InfrastructureProgressMetric = {

  category: string;

  progressPercent: number;

  schoolsCount: number;

  verifiedDeliveries: number;

};



export type FunnelStageMetric = {

  stage: string;

  count: number;

};



export type BrandAnalytics = {

  generatedAt: string;

  period: { from: string; to: string };

  summary: {

    totalSubmissions: number;

    validSubmissions: number;

    engagementRate: number;

    schoolsReached: number;

    learnersReached: number;

    activeCampaigns: number;

    codeUtilization: number;

    verificationRate: number;

    provincesReached: number;

  };

  provinces: ProvinceMetric[];

  campaigns: CampaignMetric[];

  weeklyTrend: Array<{ week: string; submissions: number }>;

  submissionTrend: SubmissionTrendSeries;

  infrastructureProgress: InfrastructureProgressMetric[];

  funnel: FunnelStageMetric[];

  channelMix: Array<{ channel: string; count: number; sharePercent: number }>;

  fraudTrend: Array<{ period: string; blocked: number; duplicates: number; flagged: number }>;

  participationTrend: Array<{ period: string; activeParticipants: number; repeatParticipants: number }>;

  topSchools: Array<{ schoolName: string; province: string; submissions: number }>;

  trust: BrandTrustMetrics;

  dataSource: "live";

};



export { emptyBrandAnalytics } from "./emptyPayloads";

