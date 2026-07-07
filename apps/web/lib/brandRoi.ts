export type BrandRoiSummary = {
  totalInvestmentZar: number;
  platformSpendZar: number;
  transformationPoolCommittedZar: number;
  transformationPoolDeployedZar: number;
  codeContributionsZar: number;
  impactValueDeliveredZar: number;
  impactEfficiencyPercent: number;
  verifiedSubmissions: number;
  schoolsReached: number;
  learnersReached: number;
  estimatedConsumerReach: number;
  engagementRate: number;
  verificationRate: number;
  provincesReached: number;
  costPerVerifiedSubmissionZar: number;
  costPerSchoolZar: number;
  costPerThousandReachZar: number;
};

export type BrandRoiFundAllocation = {
  schoolInfrastructure: number;
  operations: number;
  verificationAudits: number;
  growthReserve: number;
};

export type BrandRoiCampaignRow = {
  id: string;
  name: string;
  investmentZar: number;
  impactDeliveredZar: number;
  validSubmissions: number;
  schoolsReached: number;
  costPerVerifiedZar: number;
  progressPercent: number;
  infrastructureMilestones: number;
};

export type BrandRoiProvinceRow = {
  code: string;
  name: string;
  verifiedSubmissions: number;
  schools: number;
  impactZar: number;
  costPerVerifiedZar: number;
};

export type BrandRoiDashboard = {
  generatedAt: string;
  period: { from: string; to: string };
  summary: BrandRoiSummary;
  fundAllocation: BrandRoiFundAllocation;
  campaigns: BrandRoiCampaignRow[];
  provinces: BrandRoiProvinceRow[];
  infrastructureProgress: Array<{
    category: string;
    progressPercent: number;
    schoolsCount: number;
    verifiedDeliveries: number;
  }>;
  participationTrend: Array<{ period: string; activeParticipants: number; repeatParticipants: number }>;
  narrative: {
    headline: string;
    esgLine: string;
    boardSummary: string;
  };
  dataSource: "live";
};

export const FUND_ALLOCATION_LABELS: Record<keyof BrandRoiFundAllocation, string> = {
  schoolInfrastructure: "School infrastructure",
  operations: "Platform operations",
  verificationAudits: "Verification & audits",
  growthReserve: "Growth reserve"
};
