import type { BrandAnalytics } from "./analytics";
import type { BrandPortal } from "./brandPortal";
import type { PlatformLivePayload } from "./platformLive";

const TRUST_PROTECTIONS = [
  "Duplicate Detection",
  "Real-Time Verification",
  "Audit Tracking",
  "Abuse Monitoring",
  "Checksum Integrity",
  "Brute-Force Blocking"
];

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
    provinces: [],
    campaigns: [],
    weeklyTrend: [],
    submissionTrend: { daily: [], weekly: [], monthly: [] },
    infrastructureProgress: [
      "Toilets",
      "Water",
      "Electricity",
      "Libraries",
      "Nutrition",
      "Digital access"
    ].map((category) => ({
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
    trust: {
      fraudAttemptsBlocked: 0,
      duplicateCodesRejected: 0,
      invalidCodesRejected: 0,
      flaggedSubmissions: 0,
      auditEventsLogged: 0,
      protectionActive: true,
      protections: TRUST_PROTECTIONS,
      recentAuditEvents: [],
      fraudByOutcome: []
    },
    dataSource: "live"
  };
}

export function emptyBrandPortal(analytics: BrandAnalytics = emptyBrandAnalytics()): BrandPortal {
  return {
    brand: { id: "pending", name: "Your brand", slug: "pending", logoUrl: null },
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
      projects: []
    },
    media: [],
    notifications: []
  };
}

export function emptyPlatformLive(): PlatformLivePayload {
  const now = new Date();
  return {
    dataSource: "live",
    updatedAt: now.toISOString(),
    stats: {
      schoolsRegistered: 0,
      schoolsParticipating: 0,
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
        message: "Register your school or brand to appear on the live network.",
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

/** Shown when the live API is unreachable (e.g. local dev without API running). */
export function emptyPlatformLiveOffline(): PlatformLivePayload {
  return {
    ...emptyPlatformLive(),
    dataSource: "offline",
    pulse: ["Live stats unavailable — start the API to see registered schools and participations."],
    feed: []
  };
}
