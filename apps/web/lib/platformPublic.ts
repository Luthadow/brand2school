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
