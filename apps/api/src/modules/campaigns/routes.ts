import { Router } from "express";
import multer from "multer";
import XLSX from "xlsx";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { deriveBrandPrefix, deriveCampaignCode } from "../../lib/codeIdentity.js";
import { slugifyBrandCode, slugifyName } from "../../lib/slugify.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { campaignsRateLimit } from "../../middleware/rateLimit.js";
import { generateSecureCodeBatch } from "../codes/generateBatch.js";
import { generateSecureCodeBatchPacks } from "../codes/generateBatchPacks.js";
import { downloadCodeBatchCsv } from "../codes/downloadCodeBatch.js";
import { CODE_DOWNLOAD_BATCH_SIZE } from "../codes/batchInventory.js";
import { CampaignScopeType } from "../../generated/prisma/index.js";
import { describeCampaignScope, listProvinceOptions, remainingCampaignBudgetZar } from "./campaignEligibility.js";
import {
  assertCampaignCanGoLive,
  markRulesConfiguredIfReady,
  syncCampaignCommercialStatus
} from "../commercial/campaignActivation.js";
import { computeGracePeriodEndsAt } from "../commercial/campaignExpiry.js";
import { setupFeeZarForScope } from "../commercial/setupFees.js";
import { campaignForbiddenForBrandAdmin } from "./assertCampaignBrandAccess.js";
import {
  importCodeBatchFromFile,
  validateCodeBatchUpload
} from "../codes/importCodeBatchFromFile.js";
import { formatStructuredCode } from "../../lib/codeIdentity.js";
import {
  contributionPerCodeIsLocked,
  isAllowedContributionPerCodeZar
} from "../funding/contributionPerCode.js";
import { ensureFounderCampaignParticipationReady } from "../../bootstrap/activateFounderCampaign.js";

const createBrandSchema = z.object({
  name: z.string().min(2),
  codePrefix: z
    .string()
    .regex(/^[A-Za-z0-9]{2,8}$/)
    .transform((v) => v.toUpperCase())
    .optional()
});

const scopeTypeSchema = z.enum(["NATIONAL", "PROVINCIAL", "DISTRICT", "SCHOOL_CLUSTER"]);

const eligibilityFieldsSchema = z.object({
  scopeType: scopeTypeSchema.optional(),
  allowedProvinces: z.array(z.string().min(2)).optional(),
  allowedDistricts: z.array(z.string().min(2)).optional(),
  allowedSchoolIds: z.array(z.string().cuid()).optional(),
  budgetAllocatedZar: z.coerce.number().nonnegative().optional(),
  pauseOnBudgetExhausted: z.boolean().optional(),
  overflowCampaignId: z.string().cuid().nullable().optional()
});

const contributionPerCodeSchema = z
  .coerce.number()
  .refine((v) => v === 2 || v === 5 || v === 10, {
    message: "Contribution per verified code must be R2, R5, or R10."
  });

const campaignGoalFieldsSchema = z.object({
  category: z.string().min(2).max(80).optional(),
  infrastructureGoal: z.string().min(2).max(120).optional(),
  targetSubmissions: z.coerce.number().int().min(1).max(50_000_000).optional(),
  contributionPerCodeZar: contributionPerCodeSchema.optional(),
  contributionPoolZar: z.coerce.number().nonnegative().optional(),
  partnershipLabel: z.string().max(120).optional(),
  description: z.string().max(500).optional()
});

const createCampaignSchema = z
  .object({
    brandId: z.string().cuid().optional(),
    name: z.string().min(4),
    slug: z.string().min(3).max(48).optional(),
    campaignCode: z
      .string()
      .regex(/^[A-Za-z0-9]{2,6}$/)
      .transform((v) => v.toUpperCase())
      .optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    /** Required: R2 / R5 / R10 per verified code. */
    contributionPerCodeZar: contributionPerCodeSchema
  })
  .merge(eligibilityFieldsSchema)
  .merge(campaignGoalFieldsSchema.omit({ contributionPerCodeZar: true }));

const patchCampaignSetupSchema = campaignGoalFieldsSchema.extend({
  name: z.string().min(4).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional()
});

const createProductSchema = z.object({
  name: z.string().min(2).max(120),
  sku: z.string().max(40).optional()
});

const patchCampaignEligibilitySchema = eligibilityFieldsSchema.extend({
  isActive: z.boolean().optional()
});

export const campaignsRouter = Router();
campaignsRouter.use(campaignsRateLimit);
const upload = multer({ storage: multer.memoryStorage() });

campaignsRouter.get("/", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN_STAFF", "BRAND_ADMIN"]), async (req, res) => {
  const brandId =
    req.user?.role === "BRAND_ADMIN" ? req.user.brandId : (req.query.brandId as string | undefined);

  if (req.user?.role === "BRAND_ADMIN" && !req.user.brandId) {
    res.status(403).json({ message: "Brand scope missing." });
    return;
  }

  const campaigns = await prisma.campaign.findMany({
    where: brandId ? { brandId } : undefined,
    include: {
      brand: { select: { name: true } },
      _count: { select: { submissions: true } }
    },
    orderBy: { startsAt: "desc" }
  });

  res.json(
    campaigns.map((c) => ({
      id: c.id,
      brandId: c.brandId,
      brandName: c.brand.name,
      name: c.name,
      slug: c.slug,
      campaignCode: c.campaignCode,
      category: c.category,
      infrastructureGoal: c.infrastructureGoal,
      targetSubmissions: c.targetSubmissions,
      startsAt: c.startsAt.toISOString(),
      endsAt: c.endsAt.toISOString(),
      isActive: c.isActive,
      submissionCount: c._count.submissions,
      scopeType: c.scopeType,
      scopeLabel: describeCampaignScope(c),
      allowedProvinces: c.allowedProvinces,
      allowedDistricts: c.allowedDistricts,
      allowedSchoolIds: c.allowedSchoolIds,
      budgetAllocatedZar: c.budgetAllocatedZar != null ? Number(c.budgetAllocatedZar) : null,
      budgetConsumedZar: Number(c.budgetConsumedZar),
      remainingBudgetZar: remainingCampaignBudgetZar(c),
      pauseOnBudgetExhausted: c.pauseOnBudgetExhausted,
      overflowCampaignId: c.overflowCampaignId,
      commercialStatus: c.commercialStatus,
      setupFeeZar: Number(c.setupFeeZar),
      contributionPoolZar: c.contributionPoolZar != null ? Number(c.contributionPoolZar) : null,
      paymentVerified: Boolean(c.paymentVerifiedAt),
      codesApproved: Boolean(c.codesApprovedAt),
      rulesConfigured: Boolean(c.rulesConfiguredAt),
      launchApproved: Boolean(c.launchApprovedAt)
    }))
  );
});

campaignsRouter.get(
  "/province-options",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN_STAFF", "BRAND_ADMIN"]),
  (_req, res) => {
    res.json(listProvinceOptions());
  }
);

campaignsRouter.post("/brands", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN_STAFF"]), async (req, res) => {
  const payload = createBrandSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const existingPrefixes = new Set(
    (await prisma.brand.findMany({ select: { codePrefix: true } })).map((b) => b.codePrefix)
  );
  const codePrefix =
    payload.data.codePrefix ?? deriveBrandPrefix(payload.data.name, existingPrefixes);

  const brand = await prisma.brand.create({
    data: {
      name: payload.data.name,
      codePrefix,
      slug: slugifyBrandCode(codePrefix),
      verificationPolicy: { maxUsesPerCode: 1 }
    }
  });
  res.status(201).json(brand);
});

campaignsRouter.post(
  "/",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN_STAFF", "BRAND_ADMIN"]),
  async (req, res) => {
    const payload = createCampaignSchema.safeParse(req.body);
    if (!payload.success) {
      res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
      return;
    }

    const brandId =
      req.user?.role === "BRAND_ADMIN" ? req.user.brandId : payload.data.brandId;
    if (!brandId) {
      res.status(403).json({ message: "Brand scope required." });
      return;
    }
    if (req.user?.role === "BRAND_ADMIN" && payload.data.brandId && payload.data.brandId !== req.user.brandId) {
      res.status(403).json({ message: "Cannot create campaigns for another brand." });
      return;
    }

    if (payload.data.endsAt <= payload.data.startsAt) {
      res.status(400).json({ message: "endsAt must be after startsAt." });
      return;
    }

    const scopeType = (payload.data.scopeType ?? "NATIONAL") as CampaignScopeType;
    if (scopeType === "PROVINCIAL" && (payload.data.allowedProvinces ?? []).length === 0) {
      res.status(400).json({ message: "Select at least one province for provincial campaigns." });
      return;
    }

    const setupFeeZar = setupFeeZarForScope(scopeType);
    const slugBase = payload.data.slug ?? slugifyName(payload.data.name);
    const slug = slugBase.length >= 3 ? slugBase : `${slugBase}-${Date.now().toString(36)}`.slice(0, 48);

    const endsAt = payload.data.endsAt;
    const gracePeriodEndsAt = computeGracePeriodEndsAt({
      endsAt,
      gracePeriodDays: 14
    });

    try {
      const campaign = await prisma.campaign.create({
        data: {
          brandId,
          name: payload.data.name,
          slug: slug.toLowerCase(),
          campaignCode: payload.data.campaignCode ?? deriveCampaignCode(slug, payload.data.name),
          startsAt: payload.data.startsAt,
          endsAt,
          gracePeriodEndsAt,
          isActive: false,
          commercialStatus: "DRAFT",
          setupFeeZar,
          scopeType,
          allowedProvinces: payload.data.allowedProvinces ?? [],
          allowedDistricts: payload.data.allowedDistricts ?? [],
          allowedSchoolIds: payload.data.allowedSchoolIds ?? [],
          budgetAllocatedZar: payload.data.budgetAllocatedZar,
          pauseOnBudgetExhausted: payload.data.pauseOnBudgetExhausted ?? true,
          overflowCampaignId: payload.data.overflowCampaignId ?? undefined,
          category: payload.data.category,
          infrastructureGoal: payload.data.infrastructureGoal,
          targetSubmissions: payload.data.targetSubmissions ?? 100,
          contributionPerCodeZar: payload.data.contributionPerCodeZar,
          contributionPoolZar: payload.data.contributionPoolZar,
          partnershipLabel: payload.data.partnershipLabel,
          impactTarget: payload.data.description
            ? { description: payload.data.description }
            : undefined
        }
      });
      await markRulesConfiguredIfReady(campaign.id, campaign);
      res.status(201).json({
        ...campaign,
        scopeLabel: describeCampaignScope(campaign),
        remainingBudgetZar: remainingCampaignBudgetZar(campaign)
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create campaign.";
      if (message.includes("Unique constraint")) {
        res.status(409).json({ message: "A campaign with this slug or code already exists. Try a different name." });
        return;
      }
      res.status(400).json({ message });
    }
  }
);

campaignsRouter.get(
  "/:campaignId/activation",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN_STAFF", "BRAND_ADMIN"]),
  async (req, res) => {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.campaignId },
      select: { brandId: true }
    });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found." });
      return;
    }
    if (campaignForbiddenForBrandAdmin(req, campaign.brandId)) {
      res.status(403).json({ message: "Cannot view another brand's campaign." });
      return;
    }

    const gate = await assertCampaignCanGoLive(req.params.campaignId);
    res.json(gate);
  }
);

campaignsRouter.get(
  "/:campaignId/products",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN_STAFF", "BRAND_ADMIN"]),
  async (req, res) => {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.campaignId },
      select: { brandId: true }
    });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found." });
      return;
    }
    if (campaignForbiddenForBrandAdmin(req, campaign.brandId)) {
      res.status(403).json({ message: "Cannot view another brand's campaign." });
      return;
    }

    const products = await prisma.product.findMany({
      where: { campaignId: req.params.campaignId },
      orderBy: { createdAt: "asc" }
    });
    res.json(products);
  }
);

campaignsRouter.post(
  "/:campaignId/products",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN_STAFF", "BRAND_ADMIN"]),
  async (req, res) => {
    const payload = createProductSchema.safeParse(req.body);
    if (!payload.success) {
      res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
      return;
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.campaignId },
      select: { brandId: true }
    });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found." });
      return;
    }
    if (campaignForbiddenForBrandAdmin(req, campaign.brandId)) {
      res.status(403).json({ message: "Cannot manage another brand's campaign." });
      return;
    }

    const slug = slugifyName(payload.data.name) || `product-${Date.now().toString(36)}`;
    try {
      const product = await prisma.product.create({
        data: {
          campaignId: req.params.campaignId,
          name: payload.data.name,
          slug,
          sku: payload.data.sku
        }
      });
      res.status(201).json(product);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create product.";
      if (message.includes("Unique constraint")) {
        res.status(409).json({ message: "A product with this name already exists on this campaign." });
        return;
      }
      res.status(400).json({ message });
    }
  }
);

campaignsRouter.patch(
  "/:campaignId/setup",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN_STAFF", "BRAND_ADMIN"]),
  async (req, res) => {
    const payload = patchCampaignSetupSchema.safeParse(req.body);
    if (!payload.success) {
      res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
      return;
    }

    const existing = await prisma.campaign.findUnique({ where: { id: req.params.campaignId } });
    if (!existing) {
      res.status(404).json({ message: "Campaign not found." });
      return;
    }
    if (req.user?.role === "BRAND_ADMIN" && existing.brandId !== req.user.brandId) {
      res.status(403).json({ message: "Cannot edit another brand's campaign." });
      return;
    }

    if (
      payload.data.endsAt &&
      payload.data.startsAt &&
      payload.data.endsAt <= payload.data.startsAt
    ) {
      res.status(400).json({ message: "endsAt must be after startsAt." });
      return;
    }

    if (
      payload.data.contributionPerCodeZar !== undefined &&
      contributionPerCodeIsLocked(existing.commercialStatus)
    ) {
      res.status(409).json({
        message:
          "Contribution per verified code is locked after the campaign is activated. Create a new campaign to change the rate."
      });
      return;
    }

    let campaign = await prisma.campaign.update({
      where: { id: existing.id },
      data: {
        ...(payload.data.name !== undefined ? { name: payload.data.name } : {}),
        ...(payload.data.startsAt !== undefined ? { startsAt: payload.data.startsAt } : {}),
        ...(payload.data.endsAt !== undefined ? { endsAt: payload.data.endsAt } : {}),
        ...(payload.data.category !== undefined ? { category: payload.data.category } : {}),
        ...(payload.data.infrastructureGoal !== undefined
          ? { infrastructureGoal: payload.data.infrastructureGoal }
          : {}),
        ...(payload.data.targetSubmissions !== undefined
          ? { targetSubmissions: payload.data.targetSubmissions }
          : {}),
        ...(payload.data.contributionPerCodeZar !== undefined
          ? { contributionPerCodeZar: payload.data.contributionPerCodeZar }
          : {}),
        ...(payload.data.contributionPoolZar !== undefined
          ? { contributionPoolZar: payload.data.contributionPoolZar }
          : {}),
        ...(payload.data.partnershipLabel !== undefined
          ? { partnershipLabel: payload.data.partnershipLabel }
          : {}),
        ...(payload.data.description !== undefined
          ? { impactTarget: { description: payload.data.description } }
          : {})
      }
    });

    if (
      payload.data.contributionPerCodeZar !== undefined &&
      isAllowedContributionPerCodeZar(payload.data.contributionPerCodeZar)
    ) {
      await ensureFounderCampaignParticipationReady(prisma, campaign.brandId, campaign.id);
      campaign = (await prisma.campaign.findUnique({ where: { id: campaign.id } })) ?? campaign;
    }

    res.json({
      ...campaign,
      scopeLabel: describeCampaignScope(campaign),
      remainingBudgetZar: remainingCampaignBudgetZar(campaign)
    });
  }
);

campaignsRouter.patch(
  "/:campaignId/eligibility",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN_STAFF", "BRAND_ADMIN"]),
  async (req, res) => {
    const payload = patchCampaignEligibilitySchema.safeParse(req.body);
    if (!payload.success) {
      res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
      return;
    }

    const existing = await prisma.campaign.findUnique({ where: { id: req.params.campaignId } });
    if (!existing) {
      res.status(404).json({ message: "Campaign not found." });
      return;
    }

    if (req.user?.role === "BRAND_ADMIN" && existing.brandId !== req.user.brandId) {
      res.status(403).json({ message: "Cannot edit another brand's campaign." });
      return;
    }

    if (payload.data.isActive === true) {
      const gate = await assertCampaignCanGoLive(existing.id);
      if (!gate.canActivate) {
        res.status(400).json({
          message: "Campaign cannot be activated until commercial governance requirements are met.",
          blockers: gate.blockers,
          checklist: gate.checklist
        });
        return;
      }
    }

    const campaign = await prisma.campaign.update({
      where: { id: existing.id },
      data: {
        ...(payload.data.scopeType !== undefined ? { scopeType: payload.data.scopeType } : {}),
        ...(payload.data.allowedProvinces !== undefined ? { allowedProvinces: payload.data.allowedProvinces } : {}),
        ...(payload.data.allowedDistricts !== undefined ? { allowedDistricts: payload.data.allowedDistricts } : {}),
        ...(payload.data.allowedSchoolIds !== undefined ? { allowedSchoolIds: payload.data.allowedSchoolIds } : {}),
        ...(payload.data.budgetAllocatedZar !== undefined
          ? { budgetAllocatedZar: payload.data.budgetAllocatedZar }
          : {}),
        ...(payload.data.pauseOnBudgetExhausted !== undefined
          ? { pauseOnBudgetExhausted: payload.data.pauseOnBudgetExhausted }
          : {}),
        ...(payload.data.overflowCampaignId !== undefined
          ? { overflowCampaignId: payload.data.overflowCampaignId }
          : {}),
        ...(payload.data.isActive !== undefined
          ? {
              isActive: payload.data.isActive,
              ...(payload.data.isActive
                ? { commercialStatus: "LIVE" as const, launchApprovedAt: new Date() }
                : { commercialStatus: "PAUSED" as const })
            }
          : {})
      }
    });

    await markRulesConfiguredIfReady(campaign.id, campaign);
    await syncCampaignCommercialStatus(campaign.id);

    res.json({
      ...campaign,
      scopeLabel: describeCampaignScope(campaign),
      remainingBudgetZar: remainingCampaignBudgetZar(campaign)
    });
  }
);

const importBatchSchema = z.object({
  batchName: z.string().min(2),
  expiresAt: z
    .string()
    .optional()
    .transform((value) => (value ? new Date(value) : undefined))
});

const generateBatchSchema = z.object({
  batchName: z.string().min(2).optional(),
  /** Preferred alias for brand portal “how many codes”. */
  quantity: z.coerce.number().int().min(1).max(50000).optional(),
  count: z.coerce.number().int().min(1).max(50000).optional(),
  productId: z.string().cuid().optional(),
  batchCode: z.string().min(1).max(4).optional(),
  codeVersion: z.string().min(2).max(8).optional(),
  expiresAt: z.coerce.date().optional(),
  /** When true (default), split into 50-code download packs. */
  splitIntoPacks: z.boolean().optional()
});

campaignsRouter.post(
  "/:campaignId/code-batches/generate",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN_STAFF", "BRAND_ADMIN"]),
  async (req, res) => {
    const payload = generateBatchSchema.safeParse(req.body);
    if (!payload.success) {
      res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
      return;
    }

    const quantity = payload.data.quantity ?? payload.data.count;
    if (!quantity) {
      res.status(400).json({ message: "Provide quantity (or count) of codes to generate." });
      return;
    }

    const campaignForAccess = await prisma.campaign.findUnique({
      where: { id: req.params.campaignId },
      select: { brandId: true }
    });
    if (!campaignForAccess) {
      res.status(404).json({ message: "Campaign not found." });
      return;
    }
    if (campaignForbiddenForBrandAdmin(req, campaignForAccess.brandId)) {
      res.status(403).json({ message: "Cannot manage another brand's campaign." });
      return;
    }

    const usePacks = payload.data.splitIntoPacks !== false && !payload.data.batchCode;

    try {
      if (usePacks) {
        const result = await generateSecureCodeBatchPacks({
          campaignId: req.params.campaignId,
          quantity,
          batchNamePrefix: payload.data.batchName ?? "Campaign codes",
          productId: payload.data.productId,
          codeVersion: payload.data.codeVersion,
          expiresAt: payload.data.expiresAt,
          createdByUserId: req.user?.id
        });
        res.status(201).json({
          ...result,
          packSize: CODE_DOWNLOAD_BATCH_SIZE,
          message: `Generated ${result.generatedCount} codes in ${result.batchCount} packs of up to ${CODE_DOWNLOAD_BATCH_SIZE}.`
        });
        return;
      }

      const result = await generateSecureCodeBatch({
        campaignId: req.params.campaignId,
        batchName: payload.data.batchName ?? "Campaign codes",
        count: quantity,
        productId: payload.data.productId,
        batchCode: payload.data.batchCode,
        codeVersion: payload.data.codeVersion,
        expiresAt: payload.data.expiresAt
      });
      await prisma.codeBatch.update({
        where: { id: result.batchId },
        data: {
          status: "AVAILABLE",
          source: "GENERATE",
          ...(req.user?.id ? { createdByUserId: req.user.id } : {})
        }
      });
      await prisma.campaign.update({
        where: { id: req.params.campaignId },
        data: { codeMode: "GENERATE" }
      });
      res.status(201).json(result);
    } catch (err) {
      res.status(404).json({ message: err instanceof Error ? err.message : "Generation failed." });
    }
  }
);

campaignsRouter.get(
  "/:campaignId/code-batches/:batchId/download",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN_STAFF", "BRAND_ADMIN"]),
  async (req, res) => {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.campaignId },
      select: { brandId: true }
    });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found." });
      return;
    }
    if (campaignForbiddenForBrandAdmin(req, campaign.brandId)) {
      res.status(403).json({ message: "Cannot download another brand's codes." });
      return;
    }

    const brandIdForAccess =
      req.user?.role === "BRAND_ADMIN" && req.user.brandId ? req.user.brandId : campaign.brandId;

    const result = await downloadCodeBatchCsv({
      batchId: req.params.batchId,
      brandId: brandIdForAccess,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    if ("error" in result) {
      res.status(result.status).json({ message: result.error });
      return;
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    res.send(result.csv);
  }
);

campaignsRouter.post(
  "/:campaignId/code-batches/validate-file",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN_STAFF", "BRAND_ADMIN"]),
  upload.single("file"),
  async (req, res) => {
    const uploadedFile = (req as typeof req & { file?: { buffer: Buffer; originalname?: string } })
      .file;
    if (!uploadedFile) {
      res.status(400).json({ message: "Missing file upload." });
      return;
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.campaignId },
      select: { brandId: true }
    });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found." });
      return;
    }
    if (campaignForbiddenForBrandAdmin(req, campaign.brandId)) {
      res.status(403).json({ message: "Cannot manage another brand's campaign." });
      return;
    }

    try {
      const validation = await validateCodeBatchUpload(
        req.params.campaignId,
        uploadedFile.buffer,
        uploadedFile.originalname ?? "upload.xlsx"
      );
      res.json(validation);
    } catch (err) {
      res.status(400).json({ message: err instanceof Error ? err.message : "Validation failed." });
    }
  }
);

campaignsRouter.get(
  "/:campaignId/code-batches/import-template",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN_STAFF", "BRAND_ADMIN"]),
  async (req, res) => {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.campaignId },
      include: { brand: true }
    });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found." });
      return;
    }
    if (campaignForbiddenForBrandAdmin(req, campaign.brandId)) {
      res.status(403).json({ message: "Cannot manage another brand's campaign." });
      return;
    }

    const prefix = campaign.brand.codePrefix;
    const campaignCode = (campaign.campaignCode ?? "CAM1").toUpperCase();
    const example = formatStructuredCode(prefix, campaignCode, "B01", "SAMPLE1");

    const sheet = XLSX.utils.aoa_to_sheet([
      ["code"],
      [example],
      [formatStructuredCode(prefix, campaignCode, "B01", "SAMPLE2")]
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "codes");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${campaign.slug}-product-codes-template.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  }
);

campaignsRouter.post(
  "/:campaignId/code-batches/import",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN_STAFF", "BRAND_ADMIN"]),
  upload.single("file"),
  async (req, res) => {
    const uploadedFile = (req as typeof req & { file?: { buffer: Buffer; originalname?: string } })
      .file;
    if (!uploadedFile) {
      res.status(400).json({ message: "Missing file upload." });
      return;
    }

    const meta = importBatchSchema.safeParse(req.body);
    if (!meta.success) {
      res.status(400).json({ message: "Validation failed.", issues: meta.error.flatten() });
      return;
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.campaignId },
      select: { brandId: true }
    });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found." });
      return;
    }
    if (campaignForbiddenForBrandAdmin(req, campaign.brandId)) {
      res.status(403).json({ message: "Cannot manage another brand's campaign." });
      return;
    }

    try {
      const result = await importCodeBatchFromFile({
        campaignId: req.params.campaignId,
        buffer: uploadedFile.buffer,
        filename: uploadedFile.originalname ?? "upload.xlsx",
        batchName: meta.data.batchName,
        expiresAt: meta.data.expiresAt
      });
      res.status(201).json({
        batchId: result.batchId,
        batchCode: result.batchCode,
        importedCount: result.importedCount,
        skippedExistingCount: result.skippedExistingCount,
        validation: result
      });
    } catch (err) {
      const validation = (err as Error & { validation?: unknown }).validation;
      if (validation) {
        res.status(400).json({
          message: err instanceof Error ? err.message : "Import failed.",
          validation
        });
        return;
      }
      res.status(400).json({ message: err instanceof Error ? err.message : "Import failed." });
    }
  }
);
