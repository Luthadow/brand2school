import { Router } from "express";
import { z } from "zod";
import { processParticipationSubmission } from "./services/processParticipationSubmission.js";
import { participationRateLimit } from "../../middleware/rateLimit.js";
import { findSchoolByNameAndDistrict } from "../schools/registerSchool.js";
import { prisma } from "../../lib/prisma.js";
import {
  describeCampaignScope,
  evaluateCampaignEligibility,
  findEligibleCampaignAlternatives,
  findDefaultNationalOverflow,
  resolveOverflowCampaign,
  scopeTypeLabel
} from "../campaigns/campaignEligibility.js";
import { buildParticipationEligibilityPayload } from "./services/buildEligibilityPayload.js";

const participationSchema = z.object({
  schoolName: z.string().min(2),
  district: z.string().min(2),
  campaignSlug: z.string().min(2),
  productCode: z.string().min(2),
  whatsappMsisdn: z.string().min(8).optional(),
  source: z.string().min(2).optional()
});

const eligibilityCheckSchema = z.object({
  schoolName: z.string().min(2),
  district: z.string().min(2),
  campaignSlug: z.string().min(2)
});

export const participationRouter = Router();

participationRouter.post("/eligibility-check", participationRateLimit, async (req, res) => {
  const payload = eligibilityCheckSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const school = await findSchoolByNameAndDistrict(payload.data.schoolName, payload.data.district);
  if (!school) {
    res.status(404).json({ message: "School not found.", outcome: "SCHOOL_NOT_FOUND" });
    return;
  }

  const campaign = await prisma.campaign.findUnique({
    where: { slug: payload.data.campaignSlug.toLowerCase() }
  });
  if (!campaign) {
    res.status(404).json({ message: "Campaign not found.", outcome: "CAMPAIGN_NOT_FOUND" });
    return;
  }

  const evaluation = evaluateCampaignEligibility(campaign, school);
  const [alternatives, overflowLinked, nationalOverflow] = await Promise.all([
    findEligibleCampaignAlternatives(school, { excludeCampaignId: campaign.id, limit: 5 }),
    resolveOverflowCampaign(campaign),
    findDefaultNationalOverflow()
  ]);

  res.json({
    eligible: evaluation.eligible,
    outcome: evaluation.eligible ? "ELIGIBLE" : evaluation.reason,
    message: evaluation.eligible
      ? `School is eligible for "${campaign.name}" (${describeCampaignScope(campaign)}).`
      : evaluation.userMessage,
    remainingBudgetZar: evaluation.eligible ? evaluation.remainingBudgetZar : null,
    eligibility: evaluation.eligible
      ? null
      : buildParticipationEligibilityPayload({
          reason: evaluation.reason,
          schoolProvinceName: evaluation.schoolProvinceName,
          campaignScopeLabel: `${scopeTypeLabel(evaluation.campaignScopeType)} — ${describeCampaignScope(campaign)}`,
          allowedProvinceNames: evaluation.allowedProvinceNames,
          alternatives,
          overflowCampaign: overflowLinked ?? nationalOverflow
        })
  });
});

participationRouter.post("/submit", participationRateLimit, async (req, res) => {
  const payload = participationSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const result = await processParticipationSubmission(payload.data);
  res.status(result.status).json(result.payload);
});
