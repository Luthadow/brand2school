export type PlatformPartner = {
  slug: string;
  name: string;
  logoUrl: string;
  websiteUrl: string | null;
  brandColor: string | null;
  featured: boolean;
};

export type PublicPartnerSummary = {
  slug: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  brandColor: string | null;
  featuredOnHome: boolean;
  publicProfileEnabled: boolean;
  description: string | null;
  validSubmissions: number;
  schoolsReached: number;
  activeCampaigns: number;
};

export type PublicBrandProfile = PublicPartnerSummary & {
  verifiedPartner: boolean;
  verificationCode: string | null;
  verificationStatus: string | null;
  founderVerified: boolean;
  isTrusted: boolean;
  verifyUrl: string | null;
  brandProfileUrl: string;
  certificatePdfUrl: string | null;
  verifyQrImageUrl: string | null;
  brandQrImageUrl: string | null;
  provinces: Array<{ code: string; name: string; schools: number; submissions: number; intensity: number }>;
  campaigns: Array<{
    id: string;
    slug: string;
    name: string;
    category: string | null;
    infrastructureGoal: string | null;
    validSubmissions: number;
    targetSubmissions: number;
    schoolsParticipating: number;
    percentToTarget: number;
    isActive: boolean;
  }>;
  topSchools: Array<{ schoolName: string; province: string; submissions: number }>;
  partnerRank: number | null;
};

export type PublicCampaignCard = {
  slug: string;
  name: string;
  brandSlug: string;
  brandName: string;
  brandLogoUrl: string | null;
  category: string | null;
  infrastructureGoal: string | null;
  validSubmissions: number;
  targetSubmissions: number;
  schoolsParticipating: number;
  percentToTarget: number;
  isActive: boolean;
  scopeType?: string;
  scopeLabel?: string;
  eligibleProvinces?: string[];
  scopeBadge?: string;
};

export type PublicCampaignDetail = PublicCampaignCard & {
  startsAt: string;
  endsAt: string;
  contributionPerCodeZar: string;
  fundingRaisedZar: string;
  brandWebsiteUrl: string | null;
  brandColor: string | null;
  participationHint: string;
  budgetAllocatedZar?: number | null;
  remainingBudgetZar?: number | null;
};

export type PlatformRankings = {
  updatedAt: string;
  schools: Array<{
    rank: number;
    schoolId: string;
    schoolName: string;
    province: string;
    district: string;
    submissions: number;
  }>;
  brandPartners: Array<{
    rank: number;
    brandSlug: string;
    brandName: string;
    logoUrl: string | null;
    validSubmissions: number;
    schoolsReached: number;
    activeCampaigns: number;
  }>;
};

export type PlatformTrust = {
  verifiedSchools: number;
  activeBrandPartners: number;
  validSubmissions: number;
  openFraudFlags: number;
  partnerVerification: Record<string, boolean>;
  protections: string[];
};

export type PublicSchoolSearchHit = {
  type: "school";
  name: string;
  schoolCode: string;
  province: string;
  district: string;
  address: string;
  organizationCategory: string;
  organizationLabel: string;
  status: string;
  statusLabel: string;
  profileUrl: string;
  registered: true;
};

export type PublicSchoolSummary = {
  schoolCode: string;
  name: string;
  province: string;
  district: string;
  logoUrl: string | null;
  quintile: number | null;
  learnerCount: number;
  teacherCount: number | null;
  profileUrl: string;
  verificationApproved: boolean;
  profileCompletionPercent: number;
  verifiedSubmissions: number;
  nationalRank: number | null;
  priorityNeedTitle: string | null;
  priorityNeedCostZar: number | null;
  openNeedsCount: number;
  badgeCount: number;
  featuredBadges: string[];
};

export type PublicSchoolProfile = PublicSchoolSummary & {
  mission: string;
  vision: string;
  history: string;
  achievements: string[];
  websiteUrl: string | null;
  schoolColours: string[];
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  badges: Array<{
    id: string;
    label: string;
    description: string;
    tier: string;
    category: string;
    earned: boolean;
    earnedAt: string | null;
    progressPercent: number;
  }>;
  openNeeds: Array<{
    id: string;
    title: string;
    category: string;
    urgency: string;
    estimatedCostZar: number;
    progressPercent: number;
    sponsorStatus: string;
    learnerImpact: number;
    source: string;
  }>;
  participation: {
    verifiedSubmissions: number;
    thisMonth: number;
    learnerCount: number;
  };
  activeCampaigns: Array<{
    name: string;
    brandName: string;
    percentToTarget: number;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    eventTypeLabel: string;
    location: string | null;
    startsAt: string;
  }>;
  alumniHighlights: Array<{
    id: string;
    fullName: string;
    roleLabel: string;
    profession: string | null;
    company: string | null;
    graduationYear: number | null;
  }>;
  enterpriseHighlights: Array<{
    id: string;
    title: string;
    projectTypeLabel: string;
    studentLead: string;
    status: string;
    seekingSponsor: boolean;
  }>;
};

export type PublicBrandSearchHit = {
  type: "brand";
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  profileUrl: string;
};

export type PublicSearchResponse = {
  query: string;
  schools: PublicSchoolSearchHit[];
  brands: PublicBrandSearchHit[];
};

const TIMEOUT_MS = 3000;

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${apiBase()}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const fetchPlatformPartners = (): Promise<PlatformPartner[]> =>
  fetchJson<PlatformPartner[]>("/api/v1/platform/partners").then((r) => r ?? []);

export const fetchPartnerDirectory = (): Promise<PublicPartnerSummary[]> =>
  fetchJson<PublicPartnerSummary[]>("/api/v1/platform/partners/directory").then((r) => r ?? []);

export const fetchPublicBrand = (slug: string): Promise<PublicBrandProfile | null> =>
  fetchJson<PublicBrandProfile>(`/api/v1/platform/partners/${encodeURIComponent(slug)}`);

export const fetchPublicCampaigns = (): Promise<PublicCampaignCard[]> =>
  fetchJson<PublicCampaignCard[]>("/api/v1/platform/campaigns").then((r) => r ?? []);

export const fetchPublicCampaign = (slug: string): Promise<PublicCampaignDetail | null> =>
  fetchJson<PublicCampaignDetail>(`/api/v1/platform/campaigns/${encodeURIComponent(slug)}`);

export const fetchPlatformRankings = (): Promise<PlatformRankings | null> =>
  fetchJson<PlatformRankings>("/api/v1/platform/rankings");

export const fetchPlatformTrust = (): Promise<PlatformTrust | null> =>
  fetchJson<PlatformTrust>("/api/v1/platform/trust");

export const fetchPublicSchools = (params?: {
  province?: string;
  quintile?: number;
  q?: string;
  limit?: number;
}): Promise<PublicSchoolSummary[]> =>
  fetchJson<{ schools: PublicSchoolSummary[] }>(
    `/api/v1/platform/schools${params?.province || params?.quintile || params?.q || params?.limit ? `?${new URLSearchParams({
      ...(params.province ? { province: params.province } : {}),
      ...(params.quintile ? { quintile: String(params.quintile) } : {}),
      ...(params.q ? { q: params.q } : {}),
      ...(params.limit ? { limit: String(params.limit) } : {})
    }).toString()}` : ""}`
  ).then((r) => r?.schools ?? []);

export type PublicCommunityStats = {
  schoolCode: string;
  schoolName: string;
  engagementScore: number;
  totalParticipation: number;
  learnerSharePercent: number;
  topSupporters: Array<{ name: string; type: string; submissions: number }>;
  weekdayActivity: Array<{ day: string; count: number }>;
};

export const fetchPublicSchoolCommunity = (
  schoolCode: string
): Promise<PublicCommunityStats | null> =>
  fetchJson<{ community: PublicCommunityStats }>(
    `/api/v1/platform/schools/${encodeURIComponent(schoolCode)}/community`
  ).then((r) => r?.community ?? null);

export const fetchPublicSchool = (schoolCode: string): Promise<PublicSchoolProfile | null> =>
  fetchJson<{ profile: PublicSchoolProfile }>(
    `/api/v1/platform/schools/${encodeURIComponent(schoolCode)}`
  ).then((r) => r?.profile ?? null);

export async function fetchPublicSearch(
  q: string,
  type: "all" | "school" | "brand" = "all"
): Promise<PublicSearchResponse | null> {
  const params = new URLSearchParams({ q, type });
  try {
    const res = await fetch(`/api/platform/search?${params.toString()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicSearchResponse;
  } catch {
    return null;
  }
}
