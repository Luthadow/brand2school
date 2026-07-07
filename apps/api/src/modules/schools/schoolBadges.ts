import type { SchoolTarget } from "./getSchoolPortal.js";

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";
export type BadgeCategory = "participation" | "verification" | "community" | "impact" | "profile";

export type SchoolBadge = {
  id: string;
  label: string;
  description: string;
  tier: BadgeTier;
  category: BadgeCategory;
  earned: boolean;
  earnedAt: string | null;
  progressPercent: number;
};

export type SchoolBadgesPayload = {
  earnedCount: number;
  totalCount: number;
  level: BadgeTier;
  levelLabel: string;
  badges: SchoolBadge[];
  featured: SchoolBadge[];
};

type BadgeInput = {
  validSubmissions: number;
  verificationStatus: string;
  verificationScorePercent: number;
  profileCompletionPercent: number;
  nationalRank: number | null;
  provinceRank: number | null;
  districtRank: number | null;
  targets: SchoolTarget[];
  submittedNeedsCount: number;
  completedPhases: number;
  schoolCreatedAt: Date;
  alumniCount?: number;
  enterpriseProjectCount?: number;
};

type BadgeDef = {
  id: string;
  label: string;
  description: string;
  tier: BadgeTier;
  category: BadgeCategory;
  evaluate: (input: BadgeInput) => { earned: boolean; progressPercent: number; earnedAt?: Date };
};

const BADGE_DEFS: BadgeDef[] = [
  {
    id: "registered",
    label: "Registered",
    description: "Joined the Brand2School movement.",
    tier: "bronze",
    category: "community",
    evaluate: () => ({ earned: true, progressPercent: 100 })
  },
  {
    id: "verification-submitted",
    label: "Verification started",
    description: "Submitted your EMIS and document packet for review.",
    tier: "bronze",
    category: "verification",
    evaluate: (i) => ({
      earned: ["SUBMITTED", "UNDER_REVIEW", "APPROVED"].includes(i.verificationStatus),
      progressPercent: ["SUBMITTED", "UNDER_REVIEW", "APPROVED"].includes(i.verificationStatus) ? 100 : 0
    })
  },
  {
    id: "verified-partner",
    label: "Verified partner",
    description: "School verification approved by governance.",
    tier: "silver",
    category: "verification",
    evaluate: (i) => ({
      earned: i.verificationStatus === "APPROVED",
      progressPercent: i.verificationStatus === "APPROVED" ? 100 : i.verificationScorePercent
    })
  },
  {
    id: "verification-complete",
    label: "100% verification score",
    description: "Completed every verification checklist item.",
    tier: "gold",
    category: "verification",
    evaluate: (i) => ({
      earned: i.verificationScorePercent >= 100,
      progressPercent: Math.min(100, Math.round(i.verificationScorePercent))
    })
  },
  {
    id: "profile-complete",
    label: "Profile champion",
    description: "Professional profile at least 80% complete.",
    tier: "silver",
    category: "profile",
    evaluate: (i) => ({
      earned: i.profileCompletionPercent >= 80,
      progressPercent: Math.min(100, i.profileCompletionPercent)
    })
  },
  {
    id: "first-submission",
    label: "First participation",
    description: "Recorded your first verified code submission.",
    tier: "bronze",
    category: "participation",
    evaluate: (i) => ({
      earned: i.validSubmissions >= 1,
      progressPercent: i.validSubmissions >= 1 ? 100 : 0
    })
  },
  {
    id: "rising-momentum",
    label: "Rising momentum",
    description: "50+ verified participations.",
    tier: "bronze",
    category: "participation",
    evaluate: (i) => ({
      earned: i.validSubmissions >= 50,
      progressPercent: Math.min(100, Math.round((i.validSubmissions / 50) * 100))
    })
  },
  {
    id: "community-champion",
    label: "Community champion",
    description: "150+ verified participations from your community.",
    tier: "silver",
    category: "participation",
    evaluate: (i) => ({
      earned: i.validSubmissions >= 150,
      progressPercent: Math.min(100, Math.round((i.validSubmissions / 150) * 100))
    })
  },
  {
    id: "national-participant",
    label: "National participant",
    description: "500+ verified participations nationally.",
    tier: "gold",
    category: "participation",
    evaluate: (i) => ({
      earned: i.validSubmissions >= 500,
      progressPercent: Math.min(100, Math.round((i.validSubmissions / 500) * 100))
    })
  },
  {
    id: "gold-impact",
    label: "Gold impact school",
    description: "1 000+ verified participations — elite national impact.",
    tier: "platinum",
    category: "impact",
    evaluate: (i) => ({
      earned: i.validSubmissions >= 1000,
      progressPercent: Math.min(100, Math.round((i.validSubmissions / 1000) * 100))
    })
  },
  {
    id: "monthly-top-10",
    label: "Monthly top 10",
    description: "Ranked in the national top 10 this month.",
    tier: "gold",
    category: "impact",
    evaluate: (i) => ({
      earned: i.nationalRank != null && i.nationalRank <= 10,
      progressPercent:
        i.nationalRank == null ? 0 : i.nationalRank <= 10 ? 100 : Math.max(10, 100 - i.nationalRank * 4)
    })
  },
  {
    id: "district-leader",
    label: "District leader",
    description: "#1 school in your district this month.",
    tier: "gold",
    category: "impact",
    evaluate: (i) => ({
      earned: i.districtRank === 1,
      progressPercent: i.districtRank === 1 ? 100 : i.districtRank != null ? Math.max(20, 100 - i.districtRank * 15) : 0
    })
  },
  {
    id: "province-star",
    label: "Province star",
    description: "Top 5 school in your province this month.",
    tier: "silver",
    category: "impact",
    evaluate: (i) => ({
      earned: i.provinceRank != null && i.provinceRank <= 5,
      progressPercent:
        i.provinceRank == null ? 0 : i.provinceRank <= 5 ? 100 : Math.max(15, 100 - i.provinceRank * 12)
    })
  },
  {
    id: "campaign-hero",
    label: "Campaign hero",
    description: "Reached 50% progress on an active brand campaign.",
    tier: "silver",
    category: "community",
    evaluate: (i) => {
      const best = i.targets.length > 0 ? Math.max(...i.targets.map((t) => t.percentToTarget)) : 0;
      return {
        earned: best >= 50,
        progressPercent: Math.min(100, best * 2)
      };
    }
  },
  {
    id: "needs-advocate",
    label: "Needs advocate",
    description: "Submitted priority infrastructure needs for brand sponsors.",
    tier: "bronze",
    category: "impact",
    evaluate: (i) => ({
      earned: i.submittedNeedsCount >= 1,
      progressPercent: i.submittedNeedsCount >= 1 ? 100 : 0
    })
  },
  {
    id: "entrepreneurship-school",
    label: "Entrepreneurship school",
    description: "Three or more active student ventures or mini companies.",
    tier: "silver",
    category: "community",
    evaluate: (i) => ({
      earned: (i.enterpriseProjectCount ?? 0) >= 3,
      progressPercent: Math.min(100, Math.round(((i.enterpriseProjectCount ?? 0) / 3) * 100))
    })
  },
  {
    id: "innovation-school",
    label: "Innovation school",
    description: "Five or more active student enterprise projects.",
    tier: "gold",
    category: "community",
    evaluate: (i) => ({
      earned: (i.enterpriseProjectCount ?? 0) >= 5,
      progressPercent: Math.min(100, Math.round(((i.enterpriseProjectCount ?? 0) / 5) * 100))
    })
  },
  {
    id: "alumni-network",
    label: "Alumni network",
    description: "10+ alumni, mentors, or sponsors connected to your school.",
    tier: "silver",
    category: "community",
    evaluate: (i) => ({
      earned: (i.alumniCount ?? 0) >= 10,
      progressPercent: Math.min(100, Math.round(((i.alumniCount ?? 0) / 10) * 100))
    })
  },
  {
    id: "phase-pioneer",
    label: "Phase pioneer",
    description: "Completed two or more school development phases.",
    tier: "gold",
    category: "impact",
    evaluate: (i) => ({
      earned: i.completedPhases >= 2,
      progressPercent: Math.min(100, Math.round((i.completedPhases / 2) * 100))
    })
  }
];

function levelFromBadges(earned: SchoolBadge[]): { level: BadgeTier; label: string } {
  const tiers = earned.map((b) => b.tier);
  if (tiers.includes("platinum")) return { level: "platinum", label: "Platinum Impact School" };
  if (tiers.filter((t) => t === "gold").length >= 3) return { level: "gold", label: "Gold Impact School" };
  if (tiers.includes("gold") || tiers.filter((t) => t === "silver").length >= 3) {
    return { level: "silver", label: "Silver Impact School" };
  }
  if (earned.length >= 3) return { level: "bronze", label: "Bronze Impact School" };
  return { level: "bronze", label: "Getting started" };
}

export function buildSchoolBadges(input: BadgeInput): SchoolBadgesPayload {
  const badges: SchoolBadge[] = BADGE_DEFS.map((def) => {
    const result = def.evaluate(input);
    return {
      id: def.id,
      label: def.label,
      description: def.description,
      tier: def.tier,
      category: def.category,
      earned: result.earned,
      earnedAt: result.earned ? (result.earnedAt ?? input.schoolCreatedAt).toISOString() : null,
      progressPercent: result.progressPercent
    };
  });

  const earned = badges.filter((b) => b.earned);
  const { level, label } = levelFromBadges(earned);

  const tierOrder: Record<BadgeTier, number> = { platinum: 4, gold: 3, silver: 2, bronze: 1 };
  const featured = [...earned]
    .sort((a, b) => tierOrder[b.tier] - tierOrder[a.tier])
    .slice(0, 6);

  return {
    earnedCount: earned.length,
    totalCount: badges.length,
    level,
    levelLabel: label,
    badges,
    featured
  };
}

/** Legacy string labels for PDFs and older UI surfaces. */
export function badgeLabels(payload: SchoolBadgesPayload): string[] {
  return payload.featured.map((b) => b.label);
}
