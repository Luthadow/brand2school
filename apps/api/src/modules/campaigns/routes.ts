import { Router } from "express";
import multer from "multer";
import XLSX from "xlsx";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { computeChecksum } from "../../lib/participationCodes.js";
import { deriveBrandPrefix, deriveCampaignCode, deriveBatchCode, parseStructuredCode } from "../../lib/codeIdentity.js";
import { slugifyBrandCode } from "../../lib/slugify.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { campaignsRateLimit } from "../../middleware/rateLimit.js";
import { generateSecureCodeBatch } from "../codes/generateBatch.js";
import { CampaignScopeType } from "../../generated/prisma/index.js";
import { describeCampaignScope, listProvinceOptions, remainingCampaignBudgetZar } from "./campaignEligibility.js";
import {
  assertCampaignCanGoLive,
  markRulesConfiguredIfReady,
  syncCampaignCommercialStatus
} from "../commercial/campaignActivation.js";
import { computeGracePeriodEndsAt } from "../commercial/campaignExpiry.js";
import { setupFeeZarForScope } from "../commercial/setupFees.js";
import { filterCodesForBrand } from "../commercial/codeOwnership.js";

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

const createCampaignSchema = z
  .object({
    brandId: z.string().cuid(),
    name: z.string().min(4),
    slug: z.string().min(3),
    campaignCode: z
      .string()
      .regex(/^[A-Za-z0-9]{2,6}$/)
      .transform((v) => v.toUpperCase())
      .optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date()
  })
  .merge(eligibilityFieldsSchema);

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
    if (req.user?.role === "BRAND_ADMIN" && payload.data.brandId !== req.user.brandId) {
      res.status(403).json({ message: "Cannot create campaigns for another brand." });
      return;
    }

    if (payload.data.endsAt <= payload.data.startsAt) {
      res.status(400).json({ message: "endsAt must be after startsAt." });
      return;
    }

    const scopeType = (payload.data.scopeType ?? "NATIONAL") as CampaignScopeType;
    const setupFeeZar = setupFeeZarForScope(scopeType);

    const endsAt = payload.data.endsAt;
    const gracePeriodEndsAt = computeGracePeriodEndsAt({
      endsAt,
      gracePeriodDays: 14
    });

    const campaign = await prisma.campaign.create({
      data: {
        brandId,
        name: payload.data.name,
        slug: payload.data.slug.toLowerCase(),
        campaignCode: payload.data.campaignCode ?? deriveCampaignCode(payload.data.slug, payload.data.name),
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
        overflowCampaignId: payload.data.overflowCampaignId ?? undefined
      }
    });
    await markRulesConfiguredIfReady(campaign.id, campaign);
    res.status(201).json({
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
  batchName: z.string().min(2),
  count: z.coerce.number().int().min(1).max(50000),
  productId: z.string().cuid().optional(),
  batchCode: z.string().min(1).max(4).optional(),
  codeVersion: z.string().min(2).max(8).optional(),
  expiresAt: z.coerce.date().optional()
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

    try {
      const result = await generateSecureCodeBatch({
        campaignId: req.params.campaignId,
        batchName: payload.data.batchName,
        count: payload.data.count,
        productId: payload.data.productId,
        batchCode: payload.data.batchCode,
        codeVersion: payload.data.codeVersion,
        expiresAt: payload.data.expiresAt
      });
      res.status(201).json(result);
    } catch (err) {
      res.status(404).json({ message: err instanceof Error ? err.message : "Generation failed." });
    }
  }
);

campaignsRouter.post(
  "/:campaignId/code-batches/import",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN_STAFF", "BRAND_ADMIN"]),
  upload.single("file"),
  async (req, res) => {
    const uploadedFile = (req as typeof req & { file?: { buffer: Buffer } }).file;
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
      include: { brand: true }
    });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found." });
      return;
    }

    const workbook = XLSX.read(uploadedFile.buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      res.status(400).json({ message: "Uploaded file has no sheets." });
      return;
    }

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: "" }) as Array<
      Record<string, unknown>
    >;
    if (rows.length === 0) {
      res.status(400).json({ message: "No data rows found in file." });
      return;
    }

    const normalizedCodes: string[] = rows
      .map((row: Record<string, unknown>) => {
        const raw = row.code ?? row.CODE ?? row.product_code ?? row.PRODUCT_CODE;
        return String(raw || "").trim().toUpperCase();
      })
      .filter((value: string): value is string => value.length > 0);

    if (normalizedCodes.length === 0) {
      res.status(400).json({ message: "No valid code values found. Expected column name: code." });
      return;
    }

    const uniqueCodes: string[] = [...new Set(normalizedCodes)];

    const { valid, invalid } = filterCodesForBrand(uniqueCodes, campaign.brand.codePrefix);
    if (invalid.length > 0) {
      res.status(400).json({
        message: `Some codes do not match brand prefix ${campaign.brand.codePrefix}.`,
        invalidSample: invalid.slice(0, 25),
        invalidCount: invalid.length
      });
      return;
    }

    const existing = await prisma.code.findMany({
      where: { value: { in: valid } },
      select: { value: true }
    });
    const existingSet = new Set(existing.map((item: { value: string }) => item.value));
    const toInsert = valid.filter((value) => !existingSet.has(value));

    const existingBatches = await prisma.codeBatch.count({ where: { campaignId: campaign.id } });
    const batchCode = deriveBatchCode(existingBatches + 1).toUpperCase();

    const batch = await prisma.codeBatch.create({
      data: {
        campaignId: campaign.id,
        batchName: meta.data.batchName,
        batchCode,
        codeVersion: "V1",
        expiresAt: meta.data.expiresAt
      }
    });

    if (toInsert.length > 0) {
      await prisma.code.createMany({
        data: toInsert.map((value) => {
          const structured = parseStructuredCode(value);
          return {
            batchId: batch.id,
            brandId: campaign.brandId,
            campaignId: campaign.id,
            value,
            token: structured?.token ?? null,
            checksum: structured?.checksum ?? computeChecksum(value),
            codeVersion: "V1",
            status: "UNUSED" as const
          };
        })
      });
    }

    await syncCampaignCommercialStatus(campaign.id);

    res.status(201).json({
      batchId: batch.id,
      batchCode,
      importedCount: toInsert.length,
      skippedExistingCount: valid.length - toInsert.length
    });
  }
);
