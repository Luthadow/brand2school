import { prisma } from "../../../lib/prisma.js";
import { isInvalidCodePattern } from "../../../lib/participationCodes.js";

type RuleHit = {
  reason: string;
  weight: number;
};

export type FraudAssessment = {
  isFlagged: boolean;
  isBlocked: boolean;
  score: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  policy: string;
  reasons: string[];
  approved: boolean;
};

type FraudContext = {
  schoolId: string;
  schoolProvince: string;
  campaignSlug: string;
  codeValue: string;
  whatsappMsisdn?: string;
  codeAlreadyUsed: boolean;
  codeExists: boolean;
  now: Date;
};

const severityByScore = (score: number): FraudAssessment["severity"] => {
  if (score >= 75) return "CRITICAL";
  if (score >= 45) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "LOW";
};

const REJECT_OUTCOMES = [
  "NOT_FOUND",
  "INVALID_PATTERN",
  "DUPLICATE",
  "EXPIRED",
  "CAMPAIGN_MISMATCH",
  "BRUTE_FORCE",
  "FRAUD_BLOCKED"
];

export async function scoreFraudRisk(context: FraudContext): Promise<FraudAssessment> {
  const hits: RuleHit[] = [];
  const twoMinutesAgo = new Date(context.now.getTime() - 2 * 60 * 1000);
  const fifteenMinutesAgo = new Date(context.now.getTime() - 15 * 60 * 1000);
  const startOfDay = new Date(context.now);
  startOfDay.setHours(0, 0, 0, 0);

  if (isInvalidCodePattern(context.codeValue)) {
    hits.push({ reason: "INVALID_CODE_PATTERN", weight: 80 });
  }

  if (!context.codeExists) {
    hits.push({ reason: "CODE_NOT_FOUND", weight: 15 });
  }

  if (context.codeAlreadyUsed) {
    hits.push({ reason: "DUPLICATE_CODE_REUSE", weight: 100 });
  }

  const [
    schoolBurst,
    msisdnBurst,
    schoolDailyCount,
    msisdnDailyCount,
    failedAttempts,
    priorCodeAttempts
  ] = await Promise.all([
    prisma.submission.count({
      where: { schoolId: context.schoolId, createdAt: { gte: twoMinutesAgo } }
    }),
    context.whatsappMsisdn
      ? prisma.submission.count({
          where: { whatsappMsisdn: context.whatsappMsisdn, createdAt: { gte: twoMinutesAgo } }
        })
      : Promise.resolve(0),
    prisma.submission.count({
      where: { schoolId: context.schoolId, createdAt: { gte: startOfDay } }
    }),
    context.whatsappMsisdn
      ? prisma.submission.count({
          where: { whatsappMsisdn: context.whatsappMsisdn, createdAt: { gte: startOfDay } }
        })
      : Promise.resolve(0),
    context.whatsappMsisdn
      ? prisma.submissionAttempt.count({
          where: {
            whatsappMsisdn: context.whatsappMsisdn,
            createdAt: { gte: fifteenMinutesAgo },
            outcome: { in: REJECT_OUTCOMES }
          }
        })
      : Promise.resolve(0),
    prisma.submissionAttempt.findMany({
      where: {
        codeValue: context.codeValue.toUpperCase(),
        outcome: { in: ["DUPLICATE", "NOT_FOUND"] }
      },
      select: { district: true, schoolId: true },
      take: 5
    })
  ]);

  if (schoolBurst >= 50) hits.push({ reason: "MASS_SCHOOL_SUBMISSION_BURST", weight: 45 });
  if (msisdnBurst >= 30) hits.push({ reason: "MASS_WHATSAPP_SUBMISSION_BURST", weight: 50 });
  if (schoolDailyCount >= 200) hits.push({ reason: "HIGH_SCHOOL_DAILY_VELOCITY", weight: 20 });
  if (msisdnDailyCount >= 40) hits.push({ reason: "HIGH_WHATSAPP_DAILY_VELOCITY", weight: 25 });
  if (failedAttempts >= 15) hits.push({ reason: "BRUTE_FORCE_ATTEMPTS", weight: 90 });

  const distinctDistricts = new Set(priorCodeAttempts.map((a) => a.district).filter(Boolean));
  if (distinctDistricts.size >= 2) {
    hits.push({ reason: "GEOGRAPHIC_CODE_ANOMALY", weight: 55 });
  }

  const score = Math.min(100, hits.reduce((sum, hit) => sum + hit.weight, 0));
  const severity = severityByScore(score);
  const hardBlock = hits.some(
    (h) =>
      h.reason === "BRUTE_FORCE_ATTEMPTS" ||
      h.reason === "DUPLICATE_CODE_REUSE" ||
      h.reason === "INVALID_CODE_PATTERN"
  );
  const isBlocked = hardBlock || score >= 61;
  const isFlagged = !isBlocked && score >= 31;
  const policy = isBlocked
    ? `BLOCK_${severity}`
    : isFlagged
      ? `QUEUE_REVIEW_${severity}`
      : "AUTO_ACCEPT";

  return {
    isFlagged,
    isBlocked,
    score,
    severity,
    policy,
    reasons: hits.map((hit) => hit.reason),
    approved: !isBlocked && !isFlagged && score <= 30
  };
}
