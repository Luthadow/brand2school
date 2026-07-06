import { prisma } from "../../lib/prisma.js";
import { getSchoolCampaignProgress } from "../participation/services/campaignProgress.js";
import { getSchoolForUser } from "./registerSchool.js";
import { getSchoolRankings } from "./schoolParticipation.js";
import { getSchoolFundingLedger } from "../funding/fundingConversion.js";
import { ANNUAL_CYCLES, buildSchoolDevelopmentProfile, type SchoolDevelopmentProfile } from "./schoolDevelopment.js";
import { buildSchoolNeedsEngine, summarizeNeedsEngine } from "./schoolNeedsEngine.js";
import { schoolRecordToStored } from "./syncSchoolInfrastructure.js";
import { getOrCreateSchoolVerification } from "./schoolVerification/verificationGate.js";
import { getOrganizationCategory } from "../../lib/organizationCategories.js";
import {
  documentsReadyForClaim,
  hasActiveDeferrals,
  parseDocumentDeferrals,
  REGISTRATION_DEFERRAL_KEY
} from "./schoolVerification/documentDeferrals.js";
import { serializeSchoolVerification } from "./schoolVerification/serializeSchoolVerification.js";

export type SchoolNeedItem = {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  urgency: "Critical" | "High" | "Medium" | "Long-Term";
  description: string;
  learnerImpact: number;
  estimatedCostZar: number;
  progressPercent: number;
  status: string;
  submittedAt: string;
};

export type SchoolTarget = {
  id: string;
  name: string;
  brandName: string;
  category: string | null;
  infrastructureGoal: string | null;
  targetSubmissions: number;
  validSubmissions: number;
  percentToTarget: number;
  remainingToTarget: number;
  estimatedCompletionMonths: number;
};

export type SchoolProject = {
  id: string;
  title: string;
  stage:
    | "target_achieved"
    | "verification"
    | "funding"
    | "contractor"
    | "construction"
    | "inspection"
    | "completed";
  updatedAt: string;
};

export type SchoolSupporter = {
  name: string;
  type: string;
  submissions: number;
};

export type SchoolNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
  read: boolean;
};

export type SchoolPortal = {
  school: {
    id: string;
    name: string;
    emisNumber: string;
    schoolCode: string;
    province: string;
    district: string;
    principalName: string;
    contactEmail: string | null;
    whatsappPhone: string;
    status: string;
    learnerCount: number;
    verificationStatus: string;
    organizationCategory: string;
  };
  organization: {
    id: string;
    label: string;
    portalEyebrow: string;
    documentsTitle: string;
    documentsIntro: string;
    registrationNumber: {
      key: string;
      label: string;
      placeholder: string;
    } | null;
    documents: Array<{ key: string; label: string; required: boolean }>;
    centreTypes: Array<{ id: string; label: string }>;
  };
  verification: {
    status: string;
    emisNumber: string | null;
    registrationNumber: string | null;
    submittedAt: string | null;
    rejectionReason: string | null;
    canSubmit: boolean;
    canCompleteDocuments: boolean;
    claimReady: boolean;
    centreType: string | null;
    centreTypeLabel: string | null;
    registrationDeferred: boolean;
    hasActiveDeferrals: boolean;
    documents: Array<{
      key: string;
      label: string;
      required: boolean;
      url: string | null;
      uploaded: boolean;
      deferred: boolean;
    }>;
  };
  overview: {
    verifiedSubmissions: number;
    estimatedImpactZar: number;
    nationalScore: number;
    fundingBalanceZar: number;
    activeCampaigns: number;
    projectsInProgress: number;
    projectsCompleted: number;
    activeNeeds: number;
    targetReachedPercent: number;
    monthlyRank: number | null;
  };
  funding: Awaited<ReturnType<typeof getSchoolFundingLedger>>;
  targets: SchoolTarget[];
  needs: SchoolNeedItem[];
  supporters: SchoolSupporter[];
  projects: SchoolProject[];
  submissionsTrend: Array<{ label: string; count: number }>;
  notifications: SchoolNotification[];
  gamification: {
    level: "bronze" | "silver" | "gold";
    label: string;
    badges: string[];
    nationalRank: number | null;
  };
  whatsapp: {
    phone: string;
    commands: string[];
  };
  development: SchoolDevelopmentProfile;
  needsEngine: {
    summary: ReturnType<typeof summarizeNeedsEngine>;
    rows: ReturnType<typeof buildSchoolNeedsEngine>;
  };
  brandPartners: Array<{ brand: string; categories: string[] }>;
  annualCycles: Array<{ year: number; focus: string; phase: number }>;
};

function gamificationLevel(validSubmissions: number): SchoolPortal["gamification"] {
  if (validSubmissions === 0) {
    return {
      level: "bronze",
      label: "Getting started",
      badges: [],
      nationalRank: null
    };
  }
  if (validSubmissions >= 500) {
    return {
      level: "gold",
      label: "Gold Impact School",
      badges: ["National Participant", "Verified Partner", "Community Champion"],
      nationalRank: null
    };
  }
  if (validSubmissions >= 150) {
    return {
      level: "silver",
      label: "Silver Impact School",
      badges: ["Verified Partner", "Rising Momentum"],
      nationalRank: null
    };
  }
  return {
    level: "bronze",
    label: "Bronze Impact School",
    badges: ["Registered", "Onboarding Complete"],
    nationalRank: null
  };
}

export async function getSchoolPortal(userId: string): Promise<SchoolPortal | null> {
  const school = await getSchoolForUser(userId);
  if (!school) return null;

  const learnerCount = await prisma.learner.count({ where: { schoolId: school.id } });
  const verificationRow = await getOrCreateSchoolVerification(school.id);
  const deferrals = parseDocumentDeferrals(verificationRow.documentDeferrals);
  const deferralSnapshot = {
    organizationCategory: school.organizationCategory,
    emisNumber: verificationRow.emisNumber,
    registrationNumber: verificationRow.registrationNumber,
    principalIdPath: verificationRow.principalIdPath,
    schoolLetterPath: verificationRow.schoolLetterPath,
    emisEvidencePath: verificationRow.emisEvidencePath,
    documentPaths: (verificationRow.documentPaths as Record<string, string> | null) ?? null,
    registrationDeferred: deferrals[REGISTRATION_DEFERRAL_KEY]?.willSubmitBeforeClaim === true
  };
  const activeDeferrals = hasActiveDeferrals(deferralSnapshot, deferrals);
  const claimReady = documentsReadyForClaim(deferralSnapshot);
  const canSubmitVerification =
    verificationRow.status === "NOT_SUBMITTED" ||
    verificationRow.status === "REJECTED" ||
    activeDeferrals ||
    !claimReady;
  const canCompleteDocuments =
    activeDeferrals || (verificationRow.status !== "NOT_SUBMITTED" && !claimReady);

  const [validSubmissions, flaggedSubmissions, rejectedCount] = await Promise.all([
    prisma.submission.count({ where: { schoolId: school.id, state: "VALID" } }),
    prisma.submission.count({ where: { schoolId: school.id, state: "FLAGGED_FOR_REVIEW" } }),
    prisma.submission.count({ where: { schoolId: school.id, state: "REJECTED" } })
  ]);

  const activeCampaigns = await prisma.campaign.findMany({
    where: { isActive: true },
    include: { brand: { select: { name: true } } },
    orderBy: { name: "asc" }
  });

  const targets: SchoolTarget[] = await Promise.all(
    activeCampaigns.map(async (campaign) => {
      const progress = await getSchoolCampaignProgress(
        school.id,
        campaign.id,
        campaign.targetSubmissions
      );
      const monthsLeft = Math.max(1, Math.ceil(progress.remainingToTarget / Math.max(progress.validSubmissions / 3, 1)));
      return {
        id: campaign.id,
        name: campaign.name,
        brandName: campaign.brand.name,
        category: campaign.category,
        infrastructureGoal: campaign.infrastructureGoal,
        targetSubmissions: progress.targetSubmissions,
        validSubmissions: progress.validSubmissions,
        percentToTarget: progress.percentToTarget,
        remainingToTarget: progress.remainingToTarget,
        estimatedCompletionMonths: monthsLeft
      };
    })
  );

  const avgPercent =
    targets.length > 0
      ? Math.round(targets.reduce((s, t) => s + t.percentToTarget, 0) / targets.length)
      : 0;

  const rankings = await getSchoolRankings(20);
  const rankEntry = rankings.find((r) => r.schoolId === school.id);

  const recentSubmissions = await prisma.submission.findMany({
    where: { schoolId: school.id },
    select: { createdAt: true, state: true, area: true },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  const weekMap = new Map<string, number>();
  for (const row of recentSubmissions.filter((s) => s.state === "VALID")) {
    const d = new Date(row.createdAt);
    const key = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
    weekMap.set(key, (weekMap.get(key) ?? 0) + 1);
  }
  const submissionsTrend = [...weekMap.entries()]
    .slice(-8)
    .map(([label, count], i) => ({ label: `W${i + 1}`, count }));

  const areaCounts = new Map<string, number>();
  for (const row of recentSubmissions.filter((s) => s.state === "VALID")) {
    const area = row.area || "Community";
    areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1);
  }
  const supporters: SchoolSupporter[] = [...areaCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, submissions]) => ({
      name,
      type: name.includes("Grade") ? "Learners" : "Community",
      submissions
    }));

  let needs: SchoolNeedItem[] = [];

  const gamification = gamificationLevel(validSubmissions);
  if (rankEntry) gamification.nationalRank = rankEntry.rank;

  const notifications: SchoolNotification[] = [
    {
      id: "n1",
      title:
        targets[0]?.percentToTarget && targets[0].percentToTarget >= 50
          ? `Your school reached ${targets[0].percentToTarget}% of its target`
          : "Welcome to Brand2School",
      body:
        targets[0]?.name
          ? `${targets[0].name} — ${targets[0].validSubmissions} verified submissions so far.`
          : "Share your school code with your community on WhatsApp.",
      type: "milestone",
      createdAt: new Date().toISOString(),
      read: false
    },
    {
      id: "n2",
      title:
        verificationRow.status === "APPROVED"
          ? "EMIS verification approved"
          : verificationRow.status === "REJECTED"
            ? "Verification needs correction"
            : verificationRow.status === "SUBMITTED" || verificationRow.status === "UNDER_REVIEW"
              ? "EMIS packet under review"
              : "Submit school verification",
      body:
        verificationRow.status === "NOT_SUBMITTED"
          ? "Upload your EMIS number and supporting documents in the Documents section."
          : verificationRow.status === "REJECTED"
            ? verificationRow.rejectionReason ?? "Please resubmit corrected documents."
            : "Our governance team is reviewing your EMIS packet.",
      type: "compliance",
      createdAt: new Date().toISOString(),
      read: verificationRow.status === "APPROVED"
    }
  ];

  if (flaggedSubmissions > 0) {
    notifications.unshift({
      id: "n-flag",
      title: `${flaggedSubmissions} submission(s) under review`,
      body: "Our verification team is reviewing flagged codes. No action needed unless contacted.",
      type: "submission",
      createdAt: new Date().toISOString(),
      read: false
    });
  }

  const schoolRecord = await prisma.school.findUnique({ where: { id: school.id } });

  const development = buildSchoolDevelopmentProfile({
    schoolId: school.id,
    schoolName: school.name,
    validSubmissions,
    stored: schoolRecord ? schoolRecordToStored({
      id: school.id,
      name: school.name,
      province: school.province,
      district: school.district,
      principalName: school.principalName,
      contactEmail: school.contactEmail,
      currentPhase: schoolRecord.currentPhase,
      developmentTier: schoolRecord.developmentTier,
      developmentScores: schoolRecord.developmentScores,
      phaseHistory: schoolRecord.phaseHistory,
      infrastructureItems: schoolRecord.infrastructureItems,
      annualCycleYear: schoolRecord.annualCycleYear,
      annualCycleFocus: schoolRecord.annualCycleFocus
    }) : undefined
  });

  if (development.phaseTransition) {
    notifications.unshift({
      id: "n-phase",
      title: development.phaseTransition.opened,
      body: development.phaseTransition.completed,
      type: "phase",
      createdAt: new Date().toISOString(),
      read: false
    });
  }

  const funding = await getSchoolFundingLedger(school.id);

  const needsEngineRows = buildSchoolNeedsEngine(development);
  const needsEngineSummary = summarizeNeedsEngine(needsEngineRows);
  needs = needsEngineRows.map((row) => {
    const urgency: SchoolNeedItem["urgency"] =
      row.status === "MAINTENANCE_REQUIRED" || row.status === "PENDING"
        ? row.priority === "Critical"
          ? "Critical"
          : "High"
        : row.priority === "Long-Term"
          ? "Long-Term"
          : row.priority === "Medium"
            ? "Medium"
            : "High";
    return {
    id: row.id,
    title: row.category,
    category: `Phase ${row.phase}`,
    subcategory: row.statusLabel,
    urgency,
    description: row.ecosystemNote,
    learnerImpact: row.progressPercent > 0 ? Math.round(row.progressPercent * 4) : 0,
    estimatedCostZar: row.estimatedCostZar,
    progressPercent: row.progressPercent,
    status: row.status,
    submittedAt: row.installedAt ?? new Date().toISOString()
  };
  });

  const projectsInProgress = needs.filter(
    (n) => n.status === "IN_PROGRESS" || n.status === "ACTIVE" || n.status === "MAINTENANCE_REQUIRED"
  ).length;
  const projectsCompleted = needs.filter((n) => n.status === "COMPLETE" || n.progressPercent >= 100).length;

  const projects: SchoolProject[] = needs
    .filter((n) => n.progressPercent >= 30)
    .map((n) => ({
      id: n.id,
      title: n.title,
      stage:
        n.progressPercent >= 100
          ? "completed"
          : n.progressPercent >= 75
            ? "construction"
            : n.progressPercent >= 50
              ? "funding"
              : "verification",
      updatedAt: n.submittedAt
    }));

  const category = getOrganizationCategory(school.organizationCategory);
  const serializedVerification = serializeSchoolVerification(verificationRow, school.organizationCategory);

  return {
    school: {
      id: school.id,
      name: school.name,
      emisNumber: verificationRow.emisNumber ?? verificationRow.registrationNumber ?? "Pending",
      schoolCode: school.schoolCode,
      province: school.province,
      district: school.district,
      principalName: school.principalName,
      contactEmail: school.contactEmail,
      whatsappPhone: school.whatsappPhone,
      status: school.status,
      learnerCount,
      verificationStatus: verificationRow.status,
      organizationCategory: category.id
    },
    organization: {
      id: category.id,
      label: category.label,
      portalEyebrow: category.portalEyebrow,
      documentsTitle: category.documentsTitle,
      documentsIntro: category.documentsIntro,
      registrationNumber: category.registrationNumber
        ? {
            key: category.registrationNumber.key,
            label: category.registrationNumber.label,
            placeholder: category.registrationNumber.placeholder
          }
        : null,
      documents: category.documents.map((doc) => ({
        key: doc.key,
        label: doc.label,
        required: doc.required
      })),
      centreTypes: category.centreTypes.map((centre) => ({
        id: centre.id,
        label: centre.label
      }))
    },
    verification: {
      status: verificationRow.status,
      emisNumber: verificationRow.emisNumber,
      registrationNumber: verificationRow.registrationNumber,
      submittedAt: verificationRow.submittedAt?.toISOString() ?? null,
      rejectionReason: verificationRow.rejectionReason,
      canSubmit: canSubmitVerification,
      canCompleteDocuments,
      claimReady: serializedVerification.claimReady,
      centreType: serializedVerification.centreType,
      centreTypeLabel: serializedVerification.centreTypeLabel,
      registrationDeferred: serializedVerification.registrationDeferred,
      hasActiveDeferrals: serializedVerification.hasActiveDeferrals,
      documents: serializedVerification.documents
    },
    overview: {
      verifiedSubmissions: validSubmissions,
      estimatedImpactZar: Math.round(funding.lifetimeGrossZar) || validSubmissions,
      nationalScore: development.nationalScore,
      fundingBalanceZar: funding.balanceZar,
      activeCampaigns: activeCampaigns.length,
      projectsInProgress,
      projectsCompleted,
      activeNeeds: needs.length,
      targetReachedPercent: avgPercent,
      monthlyRank: rankEntry?.rank ?? null
    },
    targets,
    needs,
    supporters,
    projects,
    submissionsTrend,
    notifications,
    gamification,
    whatsapp: {
      phone: school.whatsappPhone,
      commands: [
        "MENU",
        "1 — Submit code (select province, district, school, campaign)",
        "2 — Check progress (select school)",
        "HELP"
      ]
    },
    development,
    needsEngine: { summary: needsEngineSummary, rows: needsEngineRows },
    funding,
    brandPartners: (
      await prisma.brand.findMany({
        where: { status: { in: ["ACTIVE", "APPROVED"] } },
        select: { name: true },
        take: 12,
        orderBy: { name: "asc" }
      })
    ).map((b) => ({ brand: b.name, categories: [] as string[] })),
    annualCycles: [...ANNUAL_CYCLES]
  };
}
