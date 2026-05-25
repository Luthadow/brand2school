import { Router } from "express";
import { z } from "zod";
import { processParticipationSubmission } from "./services/processParticipationSubmission.js";
import { participationRateLimit } from "../../middleware/rateLimit.js";
import { prisma } from "../../lib/prisma.js";
import {
  listDistrictsForProvince,
  listParticipationProvinces,
  listSchoolsForProvinceDistrict
} from "./listParticipationSchoolOptions.js";
import { resolveParticipationSchool } from "./resolveParticipationSchool.js";
import {
  describeCampaignScope,
  evaluateCampaignEligibility,
  findEligibleCampaignAlternatives,
  findDefaultNationalOverflow,
  resolveOverflowCampaign,
  scopeTypeLabel
} from "../campaigns/campaignEligibility.js";
import { buildParticipationEligibilityPayload } from "./services/buildEligibilityPayload.js";
import { listParticipationBrands } from "./listParticipationBrands.js";
import { resolveParticipationCampaign } from "./resolveParticipationCampaign.js";

const schoolSelectionSchema = z
  .object({
    schoolId: z.string().cuid().optional(),
    schoolName: z.string().min(2).optional(),
    district: z.string().min(2).optional()
  })
  .refine((d) => Boolean(d.schoolId) || (Boolean(d.schoolName) && Boolean(d.district)), {
    message: "Select a school from the list."
  });

const brandCampaignSchema = z
  .object({
    brandSlug: z.string().min(2).optional(),
    campaignSlug: z.string().min(2).optional()
  })
  .refine((d) => Boolean(d.brandSlug?.trim() || d.campaignSlug?.trim()), {
    message: "Select a brand from the list."
  });

const participationSchema = schoolSelectionSchema.and(
  brandCampaignSchema.and(
    z.object({
      productCode: z.string().min(2),
      whatsappMsisdn: z.string().min(8).optional(),
      source: z.string().min(2).optional()
    })
  )
);

const eligibilityCheckSchema = schoolSelectionSchema.and(brandCampaignSchema);

const schoolOptionsQuerySchema = z.object({
  province: z.string().min(2).optional(),
  district: z.string().min(2).optional()
});

export const participationRouter = Router();

participationRouter.get("/brands", participationRateLimit, async (_req, res) => {
  const brands = await listParticipationBrands();
  res.json({ brands });
});

participationRouter.get("/school-options", participationRateLimit, async (req, res) => {
  const query = schoolOptionsQuerySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ message: "Validation failed.", issues: query.error.flatten() });
    return;
  }

  if (!query.data.province) {
    res.json({ provinces: listParticipationProvinces() });
    return;
  }

  if (!query.data.district) {
    const districts = await listDistrictsForProvince(query.data.province);
    res.json({ districts });
    return;
  }

  const schools = await listSchoolsForProvinceDistrict(query.data.province, query.data.district);
  res.json({ schools });
});

participationRouter.post("/eligibility-check", participationRateLimit, async (req, res) => {
  const payload = eligibilityCheckSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const school = await resolveParticipationSchool(payload.data);
  if (!school) {
    res.status(404).json({ message: "School not found.", outcome: "SCHOOL_NOT_FOUND" });
    return;
  }

  const resolved = await resolveParticipationCampaign({
    brandSlug: payload.data.brandSlug,
    campaignSlug: payload.data.campaignSlug
  });
  if (!resolved.ok) {
    res.status(400).json({ message: resolved.message, outcome: "BRAND_CAMPAIGN_REQUIRED" });
    return;
  }

  const campaign = await prisma.campaign.findUnique({
    where: { slug: resolved.campaignSlug }
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

  const resolved = await resolveParticipationCampaign({
    brandSlug: payload.data.brandSlug,
    campaignSlug: payload.data.campaignSlug
  });
  if (!resolved.ok) {
    res.status(400).json({ message: resolved.message, outcome: "BRAND_CAMPAIGN_REQUIRED" });
    return;
  }

  const result = await processParticipationSubmission({
    ...payload.data,
    campaignSlug: resolved.campaignSlug
  });
  res.status(result.status).json(result.payload);
});
