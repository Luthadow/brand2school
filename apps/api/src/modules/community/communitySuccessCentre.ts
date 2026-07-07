export type CommunityRecommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  message: string;
  actionLabel?: string;
};

export type CommunitySuccessCentre = {
  belongingScore: { percent: number; label: string };
  participationScore: { percent: number; label: string };
  recognitionScore: { percent: number; label: string };
  recommendations: CommunityRecommendation[];
  stats: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    totalVerified: number;
    uniqueParticipants: number;
    monthGrowthPercent: number;
  };
};

type BuildInput = {
  validSubmissions: number;
  uniqueParticipants: number;
  engagementScore: number;
  verificationApproved: boolean;
  thisMonth: number;
  lastMonth: number;
  today: number;
  thisWeek: number;
  earnedBadges: number;
  totalBadges: number;
  linkedSchoolsCount: number;
};

export function buildCommunitySuccessCentre(input: BuildInput): CommunitySuccessCentre {
  const monthGrowthPercent =
    input.lastMonth > 0
      ? Math.round(((input.thisMonth - input.lastMonth) / input.lastMonth) * 100)
      : input.thisMonth > 0
        ? 100
        : 0;

  const belongingScore = Math.min(
    100,
    Math.round(
      input.engagementScore * 0.4 +
        Math.min(100, input.uniqueParticipants * 3) * 0.35 +
        (input.verificationApproved ? 25 : 0)
    )
  );

  const participationScore = Math.min(
    100,
    Math.round(Math.min(100, (input.validSubmissions / Math.max(input.uniqueParticipants, 1)) * 20))
  );

  const recognitionScore = Math.min(
    100,
    Math.round((input.earnedBadges / Math.max(input.totalBadges, 1)) * 100)
  );

  const recommendations: CommunityRecommendation[] = [];

  if (!input.verificationApproved) {
    recommendations.push({
      id: "complete-verification",
      priority: "high",
      message: "Complete verification to unlock full recognition and school linking.",
      actionLabel: "Documents"
    });
  }

  if (input.validSubmissions === 0) {
    recommendations.push({
      id: "first-participation",
      priority: "high",
      message: "Submit your first participation code — every verified code strengthens local schools.",
      actionLabel: "Share kit"
    });
  } else if (input.thisMonth < 5) {
    recommendations.push({
      id: "grow-participation",
      priority: "medium",
      message: "Share WhatsApp templates with parents, clubs, and ward groups to grow this month's participation.",
      actionLabel: "Share kit"
    });
  }

  if (input.linkedSchoolsCount === 0) {
    recommendations.push({
      id: "link-schools",
      priority: "medium",
      message: "Explore verified schools in your district and mobilise participation toward their needs.",
      actionLabel: "Linked schools"
    });
  }

  if (input.earnedBadges < 2 && input.validSubmissions >= 5) {
    recommendations.push({
      id: "earn-badges",
      priority: "low",
      message: "You're close to your next recognition badge — keep momentum through verified codes.",
      actionLabel: "Champions"
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "maintain-momentum",
      priority: "low",
      message: "Strong community momentum — keep recognising champions and updating your network."
    });
  }

  return {
    belongingScore: { percent: belongingScore, label: "Belonging" },
    participationScore: { percent: participationScore, label: "Participation" },
    recognitionScore: { percent: recognitionScore, label: "Recognition" },
    recommendations: recommendations.slice(0, 5),
    stats: {
      today: input.today,
      thisWeek: input.thisWeek,
      thisMonth: input.thisMonth,
      totalVerified: input.validSubmissions,
      uniqueParticipants: input.uniqueParticipants,
      monthGrowthPercent
    }
  };
}
