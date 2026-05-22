export type LiveFeedItem = {
  id: string;
  message: string;
  schoolName: string;
  province: string;
  campaignName: string;
  brandName: string;
  createdAt: string;
  ago: string;
};

export type LiveProvinceRow = {
  code: string;
  name: string;
  schools: number;
  submissions: number;
  pct: number;
};

export type SchoolRankingRow = {
  rank: number;
  schoolId: string;
  schoolName: string;
  province: string;
  district: string;
  submissions: number;
};

export type LiveCampaignRow = {
  id: string;
  name: string;
  slug: string;
  brandName: string;
  category: string | null;
  infrastructureGoal: string | null;
  validSubmissions: number;
  targetSubmissions: number;
  schoolsParticipating: number;
  percentToTarget: number;
  scopeType?: string;
  scopeLabel?: string;
  scopeBadge?: string;
};

export type PlatformLivePayload = {
  dataSource: "live";
  updatedAt: string;
  stats: {
    schoolsRegistered: number;
    schoolsParticipating: number;
    activeSchools: number;
    validSubmissions: number;
    submissionsThisMonth: number;
    provincesActive: number;
    activeCampaigns: number;
  };
  feed: LiveFeedItem[];
  leaderboard: SchoolRankingRow[];
  provinces: LiveProvinceRow[];
  campaigns: LiveCampaignRow[];
  pulse: string[];
};

export const POLL_MS = 15_000;

/** Upstream live API wait cap for SSR — avoids a hung home page when the API is slow or stuck. */
const LIVE_FETCH_TIMEOUT_MS = 2500;

export function provinceShort(province: string): string {
  const map: Record<string, string> = {
    "Eastern Cape": "EC",
    "Free State": "FS",
    Gauteng: "GP",
    "KwaZulu-Natal": "KZN",
    Limpopo: "LP",
    Mpumalanga: "MP",
    "Northern Cape": "NC",
    "North West": "NW",
    "Western Cape": "WC"
  };
  return map[province] ?? province.slice(0, 3).toUpperCase();
}

export async function fetchPlatformLive(apiBase?: string): Promise<PlatformLivePayload | null> {
  const base = apiBase ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  try {
    const res = await fetch(`${base}/api/v1/platform/live`, {
      cache: "no-store",
      signal: AbortSignal.timeout(LIVE_FETCH_TIMEOUT_MS)
    });
    if (!res.ok) return null;
    return (await res.json()) as PlatformLivePayload;
  } catch {
    return null;
  }
}

export { emptyPlatformLive } from "./emptyPayloads";
