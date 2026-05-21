import type { BrandAnalytics } from "../modules/analytics/getBrandAnalytics.js";
import type { InfrastructureProgressMetric } from "../modules/analytics/infrastructureMetrics.js";
import type { BrandPortal } from "../modules/analytics/getBrandPortal.js";
import type { BrandTrustMetrics } from "../modules/analytics/getBrandTrustMetrics.js";
import type { PlatformLivePayload } from "../modules/platform/getPlatformLive.js";
import { SA_PROVINCES } from "../modules/analytics/provinces.js";

const TRUST_PROTECTIONS = [
  "Duplicate Detection",
  "Real-Time Verification",
  "Audit Tracking",
  "Abuse Monitoring",
  "Checksum Integrity",
  "Brute-Force Blocking"
];

export function emptyBrandTrustMetrics(): BrandTrustMetrics {
  return {
    fraudAttemptsBlocked: 0,
    duplicateCodesRejected: 0,
    invalidCodesRejected: 0,
    flaggedSubmissions: 0,
    auditEventsLogged: 0,
    protectionActive: true,
    protections: TRUST_PROTECTIONS,
    recentAuditEvents: [],
    fraudByOutcome: []
  };
}

export function emptyBrandAnalytics(): BrandAnalytics {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 90);
  return {
    generatedAt: now.toISOString(),
    period: { from: from.toISOString(), to: now.toISOString() },
    summary: {
      totalSubmissions: 0,
      validSubmissions: 0,
      engagementRate: 0,
      schoolsReached: 0,
      learnersReached: 0,
      activeCampaigns: 0,
      codeUtilization: 0,
      verificationRate: 0,
      provincesReached: 0
    },
    provinces: SA_PROVINCES.map((p) => ({
      code: p.code,
      name: p.name,
      schools: 0,
      learners: 0,
      submissions: 0,
      intensity: 0
    })),
    campaigns: [],
    weeklyTrend: [],
    submissionTrend: { daily: [], weekly: [], monthly: [] },
    infrastructureProgress: (
      [
        "Toilets",
        "Water",
        "Electricity",
        "Libraries",
        "Nutrition",
        "Digital access"
      ] as InfrastructureProgressMetric["category"][]
    ).map((category) => ({
      category,
      progressPercent: 0,
      schoolsCount: 0,
      verifiedDeliveries: 0
    })),
    funnel: [],
    channelMix: [],
    fraudTrend: [],
    participationTrend: [],
    topSchools: [],
    trust: emptyBrandTrustMetrics(),
    dataSource: "live"
  };
}

export function emptyBrandPortal(input?: {
  brandId?: string;
  brandName?: string;
  analytics?: BrandAnalytics;
}): BrandPortal {
  const analytics = input?.analytics ?? emptyBrandAnalytics();
  const brandName = input?.brandName ?? "Your brand";
  return {
    brand: { id: input?.brandId ?? "pending", name: brandName },
    overview: {
      totalSubmissions: 0,
      schoolsSupported: 0,
      provincesReached: 0,
      infrastructureProjectsFunded: 0,
      activeCampaigns: 0,
      verifiedSubmissions: 0,
      verificationRate: 100,
      monthlyGrowthPercent: 0,
      estimatedLivesImpacted: 0,
      impactValueZar: 0
    },
    analytics,
    campaigns: [],
    schoolNeeds: [],
    impactPipeline: [],
    financials: {
      fundsAllocatedZar: 0,
      fundsUsedZar: 0,
      remainingTargetZar: 0,
      verifiedExpensesZar: 0,
      platformOperationalZar: 0,
      transformationPoolCommittedZar: 0,
      transformationPoolUsedZar: 0,
      projects: []
    },
    media: [],
    notifications: [
      {
        id: "welcome-brand",
        title: "Launch your first campaign",
        body: "Create a campaign and distribute codes to schools to start tracking verified participation.",
        type: "campaign",
        createdAt: new Date().toISOString(),
        read: false
      }
    ]
  };
}

export function emptyPlatformLive(): PlatformLivePayload {
  const now = new Date();
  return {
    dataSource: "live",
    updatedAt: now.toISOString(),
    stats: {
      activeSchools: 0,
      validSubmissions: 0,
      submissionsThisMonth: 0,
      provincesActive: 0,
      activeCampaigns: 0
    },
    pulse: ["Schools and brands are joining Brand2School — be among the first verified participations."],
    feed: [
      {
        id: "welcome",
        message: "Register your school or brand to appear on the live network map.",
        schoolName: "",
        province: "",
        campaignName: "",
        brandName: "",
        createdAt: now.toISOString(),
        ago: "now"
      }
    ],
    leaderboard: [],
    provinces: [],
    campaigns: []
  };
}
