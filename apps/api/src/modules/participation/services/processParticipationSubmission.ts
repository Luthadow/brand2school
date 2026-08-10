import { prisma } from "../../../lib/prisma.js";
import type { Prisma } from "../../../generated/prisma/index.js";
import { scoreFraudRisk } from "../fraud/engine.js";
import { enforceSchoolAnomalyFreeze } from "../fraud/anomaly.js";
import { enforceFraudVelocityGovernance } from "../fraud/fraudVelocityGovernance.js";
import { getSchoolCampaignProgress } from "./campaignProgress.js";
import { resolveParticipationSchool } from "../resolveParticipationSchool.js";
import { verifyParticipationCode } from "./verifyParticipationCode.js";
import { logParticipationAudit, recordSubmissionAttempt } from "./auditTrail.js";
import { recordVerifiedCodeFunding } from "../../funding/fundingConversion.js";
import {
  describeCampaignScope,
  evaluateCampaignEligibility,
  findDefaultNationalOverflow,
  findEligibleCampaignAlternatives,
  resolveOverflowCampaign,
  scopeTypeLabel
} from "../../campaigns/campaignEligibility.js";
import { buildParticipationEligibilityPayload } from "./buildEligibilityPayload.js";

export type ParticipationInput = {
  schoolId?: string;
  schoolName?: string;
  district?: string;
  campaignSlug: string;
  productCode: string;
  whatsappMsisdn?: string;
  source?: string;
};

type ParticipationResult =
  | {
      ok: true;
      status: 201;
      payload: {
        submissionId: string;
        state: string;
        message: string;
        schoolName: string;
        schoolCode: string;
        district: string;
        campaignName: string;
        campaignSlug: string;
        infrastructureGoal: string | null;
        productCode: string;
        riskScore: number;
        progress: {
          validSubmissions: number;
          targetSubmissions: number;
          percentToTarget: number;
          remainingToTarget: number;
        };
        funding?: {
          grossZar: number;
          schoolInfrastructureZar: number;
          message: string;
        };
      };
    }
  | {
      ok: false;
      status: number;
      payload: {
        message: string;
        outcome?: string;
        eligibility?: import("./buildEligibilityPayload.js").ParticipationEligibilityPayload;
      };
    };

function formatVerifiedResponse(
  schoolName: string,
  campaignName: string,
  progress: { validSubmissions: number; targetSubmissions: number; percentToTarget: number },
  infrastructureGoal: string | null,
  funding?: { grossZar: number; schoolInfrastructureZar: number }
): string {
  const goalLine = infrastructureGoal ? `\nOutcome target: ${infrastructureGoal}` : "";
  const fundingLine = funding
    ? `\nSchool Support Generated: R${funding.grossZar} (R${funding.schoolInfrastructureZar} toward school infrastructure)`
    : "";
  return [
    "✅ Code Verified",
    "",
    "Your submission helped:",
    schoolName,
    "",
    "Campaign:",
    campaignName,
    goalLine,
    fundingLine,
    "",
    "Progress:",
    `${progress.validSubmissions} / ${progress.targetSubmissions} verified contributions`,
    `${progress.percentToTarget}% toward target`
  ]
    .filter(Boolean)
    .join("\n");
}

export async function processParticipationSubmission(
  input: ParticipationInput
): Promise<ParticipationResult> {
  const now = new Date();
  const normalizedCode = input.productCode.trim().toUpperCase();

  const school = await resolveParticipationSchool(input);
  if (!school) {
    await recordSubmissionAttempt({
      codeValue: normalizedCode,
      campaignSlug: input.campaignSlug,
      district: input.district,
      whatsappMsisdn: input.whatsappMsisdn,
      outcome: "SCHOOL_NOT_FOUND",
      source: input.source
    });
    return {
      ok: false,
      status: 404,
      payload: {
        message: input.schoolId
          ? "Selected school is not active for submissions. Ask your principal to complete registration."
          : `School not found. Select your school from the list, or ask your principal to register at Brand2School.`,
        outcome: "SCHOOL_NOT_FOUND"
      }
    };
  }

  if (school.status === "SUSPENDED") {
    return {
      ok: false,
      status: 423,
      payload: {
        message: `School "${school.name}" is temporarily frozen for security review. Contact Brand2School support.`,
        outcome: "SCHOOL_FROZEN"
      }
    };
  }

  if (!["ACTIVE", "APPROVED", "VERIFIED", "PENDING"].includes(school.status)) {
    return {
      ok: false,
      status: 409,
      payload: {
        message: `School "${school.name}" is not yet active for submissions (status: ${school.status}).`,
        outcome: "SCHOOL_INACTIVE"
      }
    };
  }

  const verification = await verifyParticipationCode(normalizedCode, input.campaignSlug, now);
  if (!verification.ok) {
    await recordSubmissionAttempt({
      codeValue: normalizedCode,
      campaignSlug: input.campaignSlug,
      schoolId: school.id,
      district: school.district,
      whatsappMsisdn: input.whatsappMsisdn,
      outcome: verification.outcome,
      source: input.source
    });
    return {
      ok: false,
      status: verification.outcome === "DUPLICATE" ? 409 : 404,
      payload: { message: verification.message, outcome: verification.outcome }
    };
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: verification.code.campaignId } });
  if (!campaign) {
    return { ok: false, status: 404, payload: { message: "Campaign not found.", outcome: "NOT_FOUND" } };
  }

  const eligibility = evaluateCampaignEligibility(campaign, school, now);
  if (!eligibility.eligible) {
    const [alternatives, overflowLinked, nationalOverflow] = await Promise.all([
      findEligibleCampaignAlternatives(school, { excludeCampaignId: campaign.id, limit: 5 }),
      resolveOverflowCampaign(campaign),
      findDefaultNationalOverflow()
    ]);

    const overflowCampaign =
      overflowLinked ??
      (eligibility.reason === "GEO_INELIGIBLE" ? nationalOverflow : null);

    await recordSubmissionAttempt({
      codeValue: normalizedCode,
      campaignSlug: input.campaignSlug,
      schoolId: school.id,
      district: school.district,
      whatsappMsisdn: input.whatsappMsisdn,
      outcome: eligibility.reason,
      source: input.source
    });

    return {
      ok: false,
      status: eligibility.reason === "BUDGET_EXHAUSTED" ? 409 : 422,
      payload: {
        message: eligibility.userMessage,
        outcome: eligibility.reason,
        eligibility: buildParticipationEligibilityPayload({
          reason: eligibility.reason,
          schoolProvinceName: eligibility.schoolProvinceName,
          campaignScopeLabel: `${scopeTypeLabel(eligibility.campaignScopeType)} — ${describeCampaignScope(campaign)}`,
          allowedProvinceNames: eligibility.allowedProvinceNames,
          alternatives,
          overflowCampaign
        })
      }
    };
  }

  const fraud = await scoreFraudRisk({
    schoolId: school.id,
    schoolProvince: school.province,
    campaignSlug: input.campaignSlug,
    codeValue: normalizedCode,
    whatsappMsisdn: input.whatsappMsisdn,
    codeAlreadyUsed: false,
    codeExists: true,
    now
  });

  if (fraud.isBlocked) {
    await recordSubmissionAttempt({
      codeValue: normalizedCode,
      campaignSlug: input.campaignSlug,
      schoolId: school.id,
      district: school.district,
      whatsappMsisdn: input.whatsappMsisdn,
      outcome: "FRAUD_BLOCKED",
      riskScore: fraud.score,
      fraudSignals: fraud.reasons,
      source: input.source
    });
    return {
      ok: false,
      status: 429,
      payload: {
        message: "Submission blocked for security review. Too many suspicious attempts detected.",
        outcome: "FRAUD_BLOCKED"
      }
    };
  }

  const submission = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const locked = await tx.code.findUnique({ where: { id: verification.code.id } });
    if (!locked || locked.status !== "UNUSED") {
      throw new Error("DUPLICATE_RACE");
    }

    const created = await tx.submission.create({
      data: {
        schoolId: school.id,
        campaignId: campaign.id,
        codeValue: normalizedCode,
        area: school.province.toUpperCase(),
        district: school.district,
        source: input.source ?? "whatsapp",
        whatsappMsisdn: input.whatsappMsisdn,
        state: fraud.isFlagged ? "FLAGGED_FOR_REVIEW" : "VALID",
        riskScore: fraud.score
      }
    });

    await tx.code.update({
      where: { id: verification.code.id },
      data: {
        status: fraud.isFlagged ? "FLAGGED" : "USED",
        usedAt: now,
        usedSchoolId: school.id,
        usedDistrict: school.district,
        redeemedProvince: school.province,
        redeemedBy: input.whatsappMsisdn ?? input.source ?? "unknown",
        usedBySubmissionId: created.id
      }
    });

    if (fraud.isFlagged) {
      await tx.fraudFlag.createMany({
        data: fraud.reasons.map((reason) => ({
          submissionId: created.id,
          reason,
          severity: fraud.severity,
          riskScore: fraud.score,
          policy: fraud.policy,
          status: "OPEN"
        }))
      });
    }

    return created;
  }).catch(async (err: Error) => {
    if (err.message === "DUPLICATE_RACE") {
      await recordSubmissionAttempt({
        codeValue: normalizedCode,
        campaignSlug: input.campaignSlug,
        schoolId: school.id,
        district: school.district,
        whatsappMsisdn: input.whatsappMsisdn,
        outcome: "DUPLICATE",
        source: input.source
      });
      return null;
    }
    throw err;
  });

  if (!submission) {
    return {
      ok: false,
      status: 409,
      payload: {
        message: "This code has already been used. Each code can only be submitted once.",
        outcome: "DUPLICATE"
      }
    };
  }

  const progress = await getSchoolCampaignProgress(school.id, campaign.id, campaign.targetSubmissions);

  let funding: { grossZar: number; schoolInfrastructureZar: number; message: string } | undefined;
  if (submission.state === "VALID") {
    const brandId = verification.code.brandId ?? campaign.brandId;
    const recorded = await recordVerifiedCodeFunding({
      submissionId: submission.id,
      schoolId: school.id,
      campaignId: campaign.id,
      brandId
    });
    if (recorded) {
      funding = {
        grossZar: recorded.grossZar,
        schoolInfrastructureZar: recorded.allocations.schoolInfrastructure,
        message: `R${recorded.grossZar} School Support Generated (R${recorded.allocations.schoolInfrastructure} toward school infrastructure)`
      };
    }
  }

  await enforceSchoolAnomalyFreeze(school.id, now).catch(() => null);
  await enforceFraudVelocityGovernance({
    schoolId: school.id,
    schoolProvince: school.province,
    now
  }).catch(() => null);

  await logParticipationAudit({
    action: fraud.isFlagged ? "CODE_FLAGGED" : "CODE_VERIFIED",
    targetType: "Submission",
    targetId: submission.id,
    payload: {
      code: normalizedCode,
      schoolId: school.id,
      schoolName: school.name,
      district: school.district,
      campaignId: campaign.id,
      campaignSlug: campaign.slug,
      state: submission.state,
      riskScore: fraud.score,
      fraudSignals: fraud.reasons,
      source: input.source ?? "whatsapp",
      progress
    }
  });

  const message =
    submission.state === "FLAGGED_FOR_REVIEW"
      ? `Code received for ${school.name} and flagged for review.\n\nProgress: ${progress.validSubmissions}/${progress.targetSubmissions} (${progress.percentToTarget}% to target).`
      : formatVerifiedResponse(school.name, campaign.name, progress, campaign.infrastructureGoal, funding);

  return {
    ok: true,
    status: 201,
    payload: {
      submissionId: submission.id,
      state: submission.state,
      schoolName: school.name,
      schoolCode: school.schoolCode,
      district: school.district,
      campaignName: campaign.name,
      campaignSlug: campaign.slug,
      infrastructureGoal: campaign.infrastructureGoal,
      productCode: normalizedCode,
      riskScore: fraud.score,
      progress,
      funding,
      message
    }
  };
}
