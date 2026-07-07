import type { SchoolNeedItem, SchoolTarget } from "./getSchoolPortal.js";
import type { SchoolDevelopmentProfile } from "./schoolDevelopment.js";
import { prisma } from "../../lib/prisma.js";

export type VerificationScoreItem = {
  key: string;
  label: string;
  status: "complete" | "pending" | "missing";
};

export type SuccessScoreDimension = {
  key: string;
  label: string;
  score: number;
};

export type SuccessRecommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  message: string;
  actionLabel?: string;
};

export type ImpactTimelineEvent = {
  id: string;
  title: string;
  date: string;
  type: "registration" | "verification" | "campaign" | "milestone" | "project" | "phase";
};

export type SchoolParticipationStats = {
  today: number;
  thisWeek: number;
  thisMonth: number;
  bestCampaign: string | null;
  nationalRank: number | null;
  provinceRank: number | null;
  districtRank: number | null;
};

export type SchoolSuccessCentre = {
  verificationScore: { percent: number; items: VerificationScoreItem[] };
  successScore: { percent: number; dimensions: SuccessScoreDimension[] };
  recommendations: SuccessRecommendation[];
  participation: SchoolParticipationStats;
  impactTimeline: ImpactTimelineEvent[];
};

type BuildInput = {
  schoolId: string;
  schoolCreatedAt: Date;
  hasLogo: boolean;
  verification: {
    status: string;
    submittedAt: string | null;
    reviewedAt: string | null;
    emisNumber: string | null;
    registrationNumber: string | null;
    claimReady: boolean;
    documents: Array<{ key: string; label: string; uploaded: boolean; deferred: boolean }>;
    principalUploaded: boolean;
    locationComplete: boolean;
  };
  validSubmissions: number;
  targets: SchoolTarget[];
  needs: SchoolNeedItem[];
  development: SchoolDevelopmentProfile;
  nationalRank: number | null;
  needsAssessmentComplete: boolean;
  activeVolunteers?: number;
  upcomingEvents?: number;
  alumniCount?: number;
  enterpriseProjectCount?: number;
  crmOpenTasks?: number;
  crmOverdueTasks?: number;
};

function verificationItemStatus(complete: boolean, pending: boolean): VerificationScoreItem["status"] {
  if (complete) return "complete";
  if (pending) return "pending";
  return "missing";
}

function buildVerificationScore(input: BuildInput): SchoolSuccessCentre["verificationScore"] {
  const docsComplete =
    input.verification.claimReady ||
    input.verification.documents.every((d) => d.uploaded || d.deferred);
  const docsPending = input.verification.documents.some((d) => d.deferred && !d.uploaded);

  const items: VerificationScoreItem[] = [
    {
      key: "documents",
      label: "Documents",
      status: verificationItemStatus(docsComplete, docsPending)
    },
    {
      key: "registration",
      label: "Registration / EMIS",
      status: verificationItemStatus(
        Boolean(input.verification.emisNumber || input.verification.registrationNumber),
        input.verification.status === "SUBMITTED" || input.verification.status === "UNDER_REVIEW"
      )
    },
    {
      key: "principal",
      label: "Principal ID",
      status: verificationItemStatus(input.verification.principalUploaded, false)
    },
    {
      key: "location",
      label: "Location verified",
      status: verificationItemStatus(input.verification.locationComplete, false)
    },
    {
      key: "logo",
      label: "School logo",
      status: verificationItemStatus(input.hasLogo, false)
    },
    {
      key: "needs",
      label: "Needs assessment",
      status: verificationItemStatus(
        input.needsAssessmentComplete,
        input.needs.length > 0 && !input.needsAssessmentComplete
      )
    }
  ];

  const weights: Record<string, number> = {
    documents: 22,
    registration: 18,
    principal: 15,
    location: 15,
    logo: 10,
    needs: 20
  };

  let earned = 0;
  let total = 0;
  for (const item of items) {
    const w = weights[item.key] ?? 10;
    total += w;
    if (item.status === "complete") earned += w;
    else if (item.status === "pending") earned += w * 0.45;
  }

  return {
    percent: total > 0 ? Math.round((earned / total) * 1000) / 10 : 0,
    items
  };
}

function buildSuccessScore(
  input: BuildInput,
  verificationPercent: number
): SchoolSuccessCentre["successScore"] {
  const participationScore = Math.min(100, Math.round(Math.min(validSubmissionsCap(input.validSubmissions), 100)));
  const verificationScore = Math.round(verificationPercent);
  const communityScore = Math.min(
    100,
    Math.round(Math.min(input.validSubmissions / 5, 50) + (input.targets.length > 0 ? 35 : 0))
  );
  const campaignScore =
    input.targets.length > 0
      ? Math.round(
          input.targets.reduce((sum, t) => sum + t.percentToTarget, 0) / input.targets.length
        )
      : 0;
  const reportingScore = verificationScore >= 80 ? 100 : Math.round(verificationPercent * 0.85);

  const dimensions: SuccessScoreDimension[] = [
    { key: "participation", label: "Participation", score: participationScore },
    { key: "verification", label: "Verification", score: verificationScore },
    { key: "community", label: "Community engagement", score: communityScore },
    { key: "campaigns", label: "Campaign activity", score: campaignScore },
    { key: "reporting", label: "Reporting", score: reportingScore }
  ];

  const weights = [0.25, 0.25, 0.15, 0.2, 0.15];
  const percent = Math.round(
    dimensions.reduce((sum, d, i) => sum + d.score * (weights[i] ?? 0.2), 0) * 10
  ) / 10;

  return { percent, dimensions };
}

function validSubmissionsCap(count: number): number {
  if (count >= 1000) return 100;
  if (count >= 500) return 92;
  if (count >= 150) return 78;
  if (count >= 50) return 62;
  if (count >= 10) return 45;
  if (count >= 1) return 28;
  return 5;
}

function buildRecommendations(
  input: BuildInput,
  verification: SchoolSuccessCentre["verificationScore"]
): SuccessRecommendation[] {
  const recs: SuccessRecommendation[] = [];

  if (verification.percent < 100) {
    const missing = verification.items.filter((i) => i.status === "missing");
    if (missing.length > 0) {
      recs.push({
        id: "complete-verification",
        priority: "high",
        message: `Complete verification — ${missing.map((m) => m.label.toLowerCase()).join(", ")} still needed.`,
        actionLabel: "Open documents"
      });
    }
  }

  if (verification.items.find((i) => i.key === "logo")?.status !== "complete") {
    recs.push({
      id: "upload-logo",
      priority: "medium",
      message: "Upload your school logo to strengthen your public impact profile.",
      actionLabel: "Edit profile"
    });
  }

  if (input.targets.length === 0) {
    recs.push({
      id: "join-campaign",
      priority: "high",
      message: "Join an active brand campaign to unlock participation targets and funding.",
      actionLabel: "View targets"
    });
  } else {
    const lagging = input.targets.find((t) => t.percentToTarget < 25);
    if (lagging) {
      recs.push({
        id: "boost-campaign",
        priority: "medium",
        message: `${lagging.name} is below 25% — share your school code on WhatsApp to boost participation.`,
        actionLabel: "Campaign targets"
      });
    }
  }

  if (!input.needsAssessmentComplete) {
    recs.push({
      id: "needs-assessment",
      priority: "medium",
      message: "Complete your needs assessment so brands can see what infrastructure you require.",
      actionLabel: "School needs"
    });
  }

  if (input.validSubmissions > 0 && input.validSubmissions < 50) {
    recs.push({
      id: "grow-community",
      priority: "medium",
      message: "Grow community participation — share WhatsApp templates with parents, SGB, and local clubs.",
      actionLabel: "Community Hub"
    });
  }

  if ((input.activeVolunteers ?? 0) === 0) {
    recs.push({
      id: "register-volunteers",
      priority: "medium",
      message: "Register parent volunteers and SGB members to coordinate campaign code drives.",
      actionLabel: "People & events"
    });
  } else if ((input.upcomingEvents ?? 0) === 0) {
    recs.push({
      id: "schedule-event",
      priority: "medium",
      message: "Schedule a campaign code drive — events help mobilise verified participation.",
      actionLabel: "People & events"
    });
  }

  if ((input.alumniCount ?? 0) < 5) {
    recs.push({
      id: "grow-alumni",
      priority: "medium",
      message: "Build your alumni network — mentors, sponsors, and employers strengthen long-term school success.",
      actionLabel: "Enterprise & alumni"
    });
  }
  if ((input.enterpriseProjectCount ?? 0) === 0) {
    recs.push({
      id: "launch-venture",
      priority: "medium",
      message: "Register a student venture or mini company in your Entrepreneurship Centre.",
      actionLabel: "Enterprise & alumni"
    });
  }

  if ((input.crmOpenTasks ?? 0) === 0 && input.validSubmissions > 10) {
    recs.push({
      id: "use-school-crm",
      priority: "medium",
      message: "Use School CRM to log meetings, support requests, and renewal follow-ups.",
      actionLabel: "School CRM"
    });
  }
  if ((input.crmOverdueTasks ?? 0) > 0) {
    recs.push({
      id: "crm-overdue",
      priority: "high",
      message: `${input.crmOverdueTasks} overdue CRM task(s) — follow up on renewals and partner actions.`,
      actionLabel: "School CRM"
    });
  }

  if (input.validSubmissions === 0) {
    recs.push({
      id: "first-submission",
      priority: "high",
      message: "Submit your first participation code to appear on national leaderboards.",
      actionLabel: "Submissions"
    });
  } else if (input.nationalRank != null && input.nationalRank > 10) {
    recs.push({
      id: "climb-leaderboard",
      priority: "medium",
      message: `You are #${input.nationalRank} nationally this month — push for top 10 to earn the Monthly Top 10 badge.`,
      actionLabel: "Leaderboards"
    });
  }

  if (recs.length === 0) {
    recs.push({
      id: "maintain-momentum",
      priority: "low",
      message: "Strong momentum — keep sharing codes and update your community on campaign progress."
    });
  }

  return recs.slice(0, 5);
}

async function buildParticipationStats(
  schoolId: string,
  province: string,
  district: string,
  targets: SchoolTarget[],
  nationalRank: number | null
): Promise<SchoolParticipationStats> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const baseWhere = { schoolId, state: "VALID" as const };

  const [today, thisWeek, thisMonth] = await Promise.all([
    prisma.submission.count({ where: { ...baseWhere, createdAt: { gte: startOfDay } } }),
    prisma.submission.count({ where: { ...baseWhere, createdAt: { gte: startOfWeek } } }),
    prisma.submission.count({ where: { ...baseWhere, createdAt: { gte: startOfMonth } } })
  ]);

  const bestCampaign =
    targets.length > 0
      ? [...targets].sort((a, b) => b.validSubmissions - a.validSubmissions)[0]?.name ?? null
      : null;

  const monthGrouped = await prisma.submission.groupBy({
    by: ["schoolId"],
    where: { state: "VALID", createdAt: { gte: startOfMonth } },
    _count: { _all: true },
    orderBy: { _count: { schoolId: "desc" } }
  });

  const provinceSchools = await prisma.school.findMany({
    where: { province, status: { in: ["ACTIVE", "APPROVED", "VERIFIED"] } },
    select: { id: true }
  });
  const provinceIds = new Set(provinceSchools.map((s) => s.id));
  const provinceRanked = monthGrouped
    .filter((g) => provinceIds.has(g.schoolId))
    .findIndex((g) => g.schoolId === schoolId);

  const districtSchools = await prisma.school.findMany({
    where: { district, status: { in: ["ACTIVE", "APPROVED", "VERIFIED"] } },
    select: { id: true }
  });
  const districtIds = new Set(districtSchools.map((s) => s.id));
  const districtRanked = monthGrouped
    .filter((g) => districtIds.has(g.schoolId))
    .findIndex((g) => g.schoolId === schoolId);

  return {
    today,
    thisWeek,
    thisMonth,
    bestCampaign,
    nationalRank,
    provinceRank: provinceRanked >= 0 ? provinceRanked + 1 : null,
    districtRank: districtRanked >= 0 ? districtRanked + 1 : null
  };
}

function buildImpactTimeline(input: BuildInput): ImpactTimelineEvent[] {
  const events: ImpactTimelineEvent[] = [
    {
      id: "registered",
      title: "Registered on Brand2School",
      date: input.schoolCreatedAt.toISOString(),
      type: "registration"
    }
  ];

  if (input.verification.submittedAt) {
    events.push({
      id: "verification-submitted",
      title: "Verification submitted",
      date: input.verification.submittedAt,
      type: "verification"
    });
  }

  if (input.verification.status === "APPROVED" && input.verification.reviewedAt) {
    events.push({
      id: "verification-approved",
      title: "School verified",
      date: input.verification.reviewedAt,
      type: "verification"
    });
  }

  for (const phase of input.development.phases.filter((p) => p.status === "completed" && p.completedAt)) {
    events.push({
      id: `phase-${phase.phase}`,
      title: `Phase ${phase.phase} complete — ${phase.title}`,
      date: phase.completedAt!,
      type: "phase"
    });
  }

  for (const target of input.targets.filter((t) => t.validSubmissions > 0).slice(0, 3)) {
    events.push({
      id: `campaign-${target.id}`,
      title: `${target.brandName} — ${target.validSubmissions} verified submissions`,
      date: new Date().toISOString(),
      type: "campaign"
    });
  }

  for (const need of input.needs.filter((n) => n.progressPercent >= 100).slice(0, 3)) {
    events.push({
      id: `project-${need.id}`,
      title: `${need.title} milestone reached`,
      date: need.submittedAt,
      type: "project"
    });
  }

  if (input.validSubmissions >= 1000) {
    events.push({
      id: "milestone-1000",
      title: "1 000 verified participations",
      date: new Date().toISOString(),
      type: "milestone"
    });
  } else if (input.validSubmissions >= 100) {
    events.push({
      id: "milestone-100",
      title: "100 verified participations",
      date: new Date().toISOString(),
      type: "milestone"
    });
  }

  return events
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12);
}

export async function buildSchoolSuccessCentre(input: BuildInput & {
  province: string;
  district: string;
}): Promise<SchoolSuccessCentre> {
  const verificationScore = buildVerificationScore(input);
  const successScore = buildSuccessScore(input, verificationScore.percent);
  const recommendations = buildRecommendations(input, verificationScore);
  const participation = await buildParticipationStats(
    input.schoolId,
    input.province,
    input.district,
    input.targets,
    input.nationalRank
  );
  const impactTimeline = buildImpactTimeline(input);

  return {
    verificationScore,
    successScore,
    recommendations,
    participation,
    impactTimeline
  };
}
