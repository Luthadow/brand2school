export type CommunityBadge = {
  id: string;
  label: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  earned: boolean;
  progressPercent: number;
};

export type CommunityRecognition = {
  level: "starter" | "active" | "champion" | "legend";
  levelLabel: string;
  earnedBadges: number;
  totalBadges: number;
  badges: CommunityBadge[];
  featured: CommunityBadge[];
};

type RecognitionInput = {
  validSubmissions: number;
  uniqueParticipants: number;
  verificationApproved: boolean;
  engagementScore: number;
  districtRank: number | null;
};

const BADGE_DEFS: Array<{
  id: string;
  label: string;
  description: string;
  tier: CommunityBadge["tier"];
  evaluate: (i: RecognitionInput) => { earned: boolean; progressPercent: number };
}> = [
  {
    id: "verified-partner",
    label: "Verified partner",
    description: "Organisation verification approved on Brand2School.",
    tier: "silver",
    evaluate: (i) => ({
      earned: i.verificationApproved,
      progressPercent: i.verificationApproved ? 100 : 0
    })
  },
  {
    id: "first-code",
    label: "First participation",
    description: "Your first verified participation code.",
    tier: "bronze",
    evaluate: (i) => ({
      earned: i.validSubmissions >= 1,
      progressPercent: i.validSubmissions >= 1 ? 100 : 0
    })
  },
  {
    id: "momentum-10",
    label: "Building momentum",
    description: "10+ verified participations from your community.",
    tier: "bronze",
    evaluate: (i) => ({
      earned: i.validSubmissions >= 10,
      progressPercent: Math.min(100, Math.round((i.validSubmissions / 10) * 100))
    })
  },
  {
    id: "community-champion",
    label: "Community champion",
    description: "50+ verified participations driving local impact.",
    tier: "silver",
    evaluate: (i) => ({
      earned: i.validSubmissions >= 50,
      progressPercent: Math.min(100, Math.round((i.validSubmissions / 50) * 100))
    })
  },
  {
    id: "district-star",
    label: "District star",
    description: "Top 5 community contributor in your district this month.",
    tier: "gold",
    evaluate: (i) => ({
      earned: i.districtRank != null && i.districtRank <= 5,
      progressPercent:
        i.districtRank == null ? 0 : i.districtRank <= 5 ? 100 : Math.max(15, 100 - i.districtRank * 12)
    })
  },
  {
    id: "belonging-builder",
    label: "Belonging builder",
    description: "25+ unique participants engaged through your hub.",
    tier: "gold",
    evaluate: (i) => ({
      earned: i.uniqueParticipants >= 25,
      progressPercent: Math.min(100, Math.round((i.uniqueParticipants / 25) * 100))
    })
  },
  {
    id: "impact-legend",
    label: "Impact legend",
    description: "150+ verified participations — elite community impact.",
    tier: "platinum",
    evaluate: (i) => ({
      earned: i.validSubmissions >= 150,
      progressPercent: Math.min(100, Math.round((i.validSubmissions / 150) * 100))
    })
  }
];

function levelFromBadges(earned: CommunityBadge[]): { level: CommunityRecognition["level"]; label: string } {
  const tiers = earned.map((b) => b.tier);
  if (tiers.includes("platinum")) return { level: "legend", label: "Impact legend" };
  if (tiers.filter((t) => t === "gold").length >= 2) return { level: "champion", label: "Community champion" };
  if (earned.length >= 3) return { level: "active", label: "Active community" };
  return { level: "starter", label: "Getting started" };
}

export function buildCommunityRecognition(input: RecognitionInput): CommunityRecognition {
  const badges: CommunityBadge[] = BADGE_DEFS.map((def) => {
    const result = def.evaluate(input);
    return {
      id: def.id,
      label: def.label,
      description: def.description,
      tier: def.tier,
      earned: result.earned,
      progressPercent: result.progressPercent
    };
  });

  const earned = badges.filter((b) => b.earned);
  const { level, label } = levelFromBadges(earned);

  return {
    level,
    levelLabel: label,
    earnedBadges: earned.length,
    totalBadges: badges.length,
    badges,
    featured: earned.slice(0, 4)
  };
}
