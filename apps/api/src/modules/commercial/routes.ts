import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { deriveBrandPrefix } from "../../lib/codeIdentity.js";
import { slugifyBrandCode } from "../../lib/slugify.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { agreementGeneratedPath, agreementSignedPath, resolveCommercialPublicUrl, saveCommercialPdf } from "../../lib/commercialStorage.js";
import { buildParticipationAgreementPdf } from "./agreementPdf.js";
import {
  assertCampaignCanGoLive,
  defaultSetupFeeForCampaign,
  evaluateActivationGate,
  loadCampaignForActivation,
  markRulesConfiguredIfReady,
  nextInvoiceNumber,
  serializeCommercialCampaign,
  syncCampaignCommercialStatus
} from "./campaignActivation.js";
import {
  initBrandSubscriptionFromScope,
  serializeBrandSubscription,
  subscriptionPlanFromPackageId
} from "./brandSubscription.js";
import { setupFeeZarForScope, formatZar } from "./setupFees.js";
import { defaultMonthlySubscriptionZar } from "./territorialPackages.js";
import { filterCodesForBrand } from "./codeOwnership.js";
import { packageById, serializeCommercialCatalog, type TerritorialPackageId } from "./territorialPackages.js";
import { getCommercialWorkflowBoard } from "./getCommercialWorkflow.js";
import { refreshCampaignImpactDelivered } from "./impactMetrics.js";
import { computeGracePeriodEndsAt } from "./campaignExpiry.js";
import {
  sendBrandAgreementRequiredEmail,
  sendBrandCampaignActivatedEmail,
  sendBrandPaymentPendingEmail,
  sendBrandPaymentVerifiedEmail,
  sendBrandRegistrationGuideEmail,
  sendBrandVerificationApprovedEmail
} from "../../lib/mail.js";
import { trySendBrandLifecycleEmail } from "./brandEmailNotify.js";
import { processAnnualLicenseRenewalGovernance } from "./campaignRenewal.js";
import {
  notifySubscriptionReactivated,
  processSubscriptionGovernance
} from "./subscriptionGovernance.js";
import { buildProcurementPackZip, procurementPackFilename } from "./procurementPack/buildProcurementPack.js";
import {
  buildPartnershipLabel,
  computeLicenseEndsAt,
  LICENSE_TERM_MONTHS_DEFAULT,
  serializeTransformationLicenseModel
} from "./transformationLicense.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

const contactPersonSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.string().min(2).optional(),
  phone: z.string().min(6).optional()
});

const brandApplicationSchema = z.object({
  companyName: z.string().min(2),
  legalName: z.string().min(2).optional(),
  registrationNumber: z.string().min(4),
  vatNumber: z.string().min(4).optional(),
  primaryContactEmail: z.string().email(),
  contactPersons: z.array(contactPersonSchema).min(1),
  intendedProvinces: z.array(z.string().min(2)).min(1),
  campaignIntention: z.string().min(10),
  productsInvolved: z.string().min(2),
  codePrefix: z
    .string()
    .regex(/^[A-Za-z0-9]{2,8}$/)
    .transform((v) => v.toUpperCase())
    .optional(),
  proposedCampaignName: z.string().min(4).optional(),
  proposedScopeType: z.enum(["NATIONAL", "PROVINCIAL", "DISTRICT", "SCHOOL_CLUSTER"]).optional(),
  territorialPackageId: z
    .enum([
      "SCHOOL_TRANSFORMATION",
      "DISTRICT_TRANSFORMATION",
      "PROVINCIAL_IMPACT",
      "NATIONAL_TRANSFORMATION",
      "GOVERNMENT_INSTITUTIONAL"
    ])
    .optional(),
  contributionPoolZar: z.coerce.number().nonnegative().optional(),
  popiaComplianceAccepted: z.literal(true, {
    errorMap: () => ({ message: "POPIA compliance acceptance is required." })
  })
});

export const commercialPublicRouter = Router();

commercialPublicRouter.get("/packages", (_req, res) => {
  res.json(serializeCommercialCatalog());
});

commercialPublicRouter.get("/ecosystem", (_req, res) => {
  res.json(serializeTransformationLicenseModel());
});

const procurementPackQuerySchema = z.object({
  package: z
    .enum([
      "SCHOOL_TRANSFORMATION",
      "DISTRICT_TRANSFORMATION",
      "PROVINCIAL_IMPACT",
      "NATIONAL_TRANSFORMATION",
      "GOVERNMENT_INSTITUTIONAL"
    ])
    .optional()
});

commercialPublicRouter.get("/procurement-pack", async (req, res) => {
  const query = procurementPackQuerySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ message: "Invalid package query parameter.", issues: query.error.flatten() });
    return;
  }

  try {
    const highlightedPackageId = query.data.package as TerritorialPackageId | undefined;
    const zip = await buildProcurementPackZip({ highlightedPackageId });
    const filename = procurementPackFilename(highlightedPackageId);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(zip);
  } catch (err) {
    console.error("[procurement-pack] build failed:", err);
    res.status(500).json({ message: "Could not generate partnership pack." });
  }
});

commercialPublicRouter.post("/brand-applications", async (req, res) => {
  const payload = brandApplicationSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const existingPrefixes = new Set(
    (await prisma.brand.findMany({ select: { codePrefix: true } })).map((b) => b.codePrefix)
  );

  let codePrefix = payload.data.codePrefix;
  if (codePrefix && existingPrefixes.has(codePrefix)) {
    res.status(409).json({ message: "Code prefix already in use. Choose another." });
    return;
  }
  if (!codePrefix) {
    codePrefix = deriveBrandPrefix(payload.data.companyName, existingPrefixes);
  }

  const slug = slugifyBrandCode(codePrefix);
  const slugTaken = await prisma.brand.findUnique({ where: { slug } });
  if (slugTaken) {
    res.status(409).json({ message: "Brand slug conflict. Try a different code prefix." });
    return;
  }

  const pkg = payload.data.territorialPackageId
    ? packageById(payload.data.territorialPackageId as TerritorialPackageId)
    : undefined;
  const scopeType = pkg?.scopeType ?? payload.data.proposedScopeType ?? "PROVINCIAL";
  const setupFee =
    pkg?.id === "GOVERNMENT_INSTITUTIONAL" ? 0 : setupFeeZarForScope(scopeType);

  const subInit =
    pkg?.id === "GOVERNMENT_INSTITUTIONAL"
      ? null
      : initBrandSubscriptionFromScope(scopeType);
  const subPlan =
    subscriptionPlanFromPackageId(payload.data.territorialPackageId as TerritorialPackageId | undefined) ??
    subInit?.subscriptionPlan ??
    null;

  const brand = await prisma.brand.create({
    data: {
      name: payload.data.companyName,
      legalName: payload.data.legalName ?? payload.data.companyName,
      codePrefix,
      slug,
      registrationNumber: payload.data.registrationNumber,
      vatNumber: payload.data.vatNumber,
      primaryContactEmail: payload.data.primaryContactEmail,
      contactPersons: payload.data.contactPersons,
      intendedProvinces: payload.data.intendedProvinces,
      campaignIntention: payload.data.campaignIntention,
      productsInvolved: payload.data.productsInvolved,
      onboardingStatus: "PENDING_REVIEW",
      status: "PENDING",
      verificationPolicy: { maxUsesPerCode: 1 },
      ...(subPlan && subInit
        ? {
            subscriptionPlan: subPlan,
            recurringAmountZar: subInit.recurringAmountZar,
            billingCycle: subInit.billingCycle
          }
        : {})
    }
  });

  let campaignId: string | undefined;
  if (payload.data.proposedCampaignName) {
    const campaignSlug = `${slug}-${Date.now().toString(36)}`.slice(0, 48);
    const startsAt = new Date();
    const licenseTermMonths = LICENSE_TERM_MONTHS_DEFAULT;
    const endsAt = computeLicenseEndsAt(startsAt, licenseTermMonths);
    const province =
      scopeType === "PROVINCIAL" && payload.data.intendedProvinces[0]
        ? payload.data.intendedProvinces[0]
        : undefined;
    const campaign = await prisma.campaign.create({
      data: {
        brandId: brand.id,
        name: payload.data.proposedCampaignName,
        slug: campaignSlug,
        campaignCode: campaignSlug.slice(-4).toUpperCase(),
        startsAt,
        endsAt,
        licenseTermMonths,
        partnershipLabel: buildPartnershipLabel({
          brandName: brand.name,
          provinceOrTerritory: province,
          scopeType
        }),
        sponsorshipTrack: "FULL_TERRITORY",
        gracePeriodEndsAt: computeGracePeriodEndsAt({ endsAt, gracePeriodDays: 14 }),
        isActive: false,
        scopeType,
        allowedProvinces: scopeType === "PROVINCIAL" ? payload.data.intendedProvinces : [],
        setupFeeZar: setupFee,
        contributionPoolZar: payload.data.contributionPoolZar,
        commercialStatus: "DRAFT"
      }
    });
    campaignId = campaign.id;
  }

  await prisma.auditLog.create({
    data: {
      action: "BRAND_APPLICATION_SUBMITTED",
      targetType: "Brand",
      targetId: brand.id,
      payload: {
        campaignId,
        scopeType,
        territorialPackageId: payload.data.territorialPackageId,
        popiaComplianceAccepted: payload.data.popiaComplianceAccepted
      }
    }
  });

  const contactEmail = payload.data.primaryContactEmail;
  const contactPerson = payload.data.contactPersons[0];
  const guideRecipient = contactEmail || contactPerson?.email;
  if (guideRecipient) {
    try {
      await sendBrandRegistrationGuideEmail({
        to: guideRecipient,
        contactName: contactPerson?.name ?? payload.data.companyName,
        brandName: brand.name,
        codePrefix: brand.codePrefix,
        packageName: pkg?.name
      });
    } catch (err) {
      console.error("[mail] brand registration guide failed:", err);
    }
  }

  res.status(201).json({
    brandId: brand.id,
    campaignId,
    onboardingStatus: brand.onboardingStatus,
    codePrefix: brand.codePrefix,
    message:
      "Application received. Our team will verify your business details and contact you with the participation agreement."
  });
});

export const commercialBrandRouter = Router();
commercialBrandRouter.use(requireAuth, requireRole(["BRAND_ADMIN", "SUPER_ADMIN", "ADMIN_STAFF"]));

commercialBrandRouter.get("/onboarding", async (req, res) => {
  const brandId = req.user?.role === "BRAND_ADMIN" ? req.user.brandId : (req.query.brandId as string | undefined);
  if (!brandId) {
    res.status(400).json({ message: "brandId required." });
    return;
  }

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      agreements: { orderBy: { version: "desc" }, take: 3 },
      campaigns: {
        include: { invoices: true, _count: { select: { codes: true } } },
        orderBy: { createdAt: "desc" }
      }
    }
  });
  if (!brand) {
    res.status(404).json({ message: "Brand not found." });
    return;
  }

  const latestAgreement = brand.agreements[0] ?? null;
  const allInvoices = brand.campaigns.flatMap((c) =>
    c.invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      invoiceType: inv.invoiceType,
      amountZar: Number(inv.amountZar),
      status: inv.status,
      eftReference: inv.eftReference,
      issuedAt: inv.issuedAt?.toISOString() ?? null,
      verifiedAt: inv.verifiedAt?.toISOString() ?? null,
      campaignName: c.name
    }))
  );

  res.json({
    brand: {
      id: brand.id,
      name: brand.name,
      onboardingStatus: brand.onboardingStatus,
      status: brand.status,
      codePrefix: brand.codePrefix
    },
    subscription: serializeBrandSubscription(brand),
    billing: {
      invoices: allInvoices,
      operationalRule:
        "Operational subscriptions fund platform operations only. Transformation pools never fund operational overhead."
    },
    agreement: latestAgreement
      ? {
          id: latestAgreement.id,
          version: latestAgreement.version,
          status: latestAgreement.status,
          generatedPdfUrl: resolveCommercialPublicUrl(latestAgreement.generatedPdfPath),
          signedPdfUrl: resolveCommercialPublicUrl(latestAgreement.signedPdfPath)
        }
      : null,
    campaigns: await Promise.all(
      brand.campaigns.map(async (c) => {
        const loaded = await loadCampaignForActivation(c.id);
        const activation = loaded
          ? evaluateActivationGate(loaded, c._count.codes)
          : {
              canActivate: false,
              blockers: ["Campaign not found."],
              checklist: {
                brandOnboarding: false,
                agreementSigned: false,
                activationFeeVerified: false,
                subscriptionActive: false,
                setupPaymentVerified: false,
                codesApproved: false,
                rulesConfigured: false,
                launchApproved: false
              }
            };
        return await serializeCommercialCampaign(
          loaded ?? { ...c, brand: { ...brand, agreements: brand.agreements }, invoices: c.invoices },
          c._count.codes,
          activation
        );
      })
    )
  });
});

commercialBrandRouter.post(
  "/agreements/:agreementId/upload-signed",
  upload.single("file"),
  async (req, res) => {
    const file = (req as typeof req & { file?: { buffer: Buffer; mimetype: string } }).file;
    if (!file) {
      res.status(400).json({ message: "Missing signed agreement PDF." });
      return;
    }
    if (file.mimetype !== "application/pdf") {
      res.status(400).json({ message: "Signed agreement must be a PDF." });
      return;
    }

    const agreement = await prisma.brandAgreement.findUnique({
      where: { id: req.params.agreementId },
      include: { brand: true }
    });
    if (!agreement) {
      res.status(404).json({ message: "Agreement not found." });
      return;
    }
    if (req.user?.role === "BRAND_ADMIN" && req.user.brandId !== agreement.brandId) {
      res.status(403).json({ message: "Forbidden." });
      return;
    }

    const signedPath = agreementSignedPath(agreement.brandId, agreement.version);
    await saveCommercialPdf(signedPath, file.buffer);

    const updated = await prisma.brandAgreement.update({
      where: { id: agreement.id },
      data: {
        signedPdfPath: signedPath,
        status: "UPLOADED",
        uploadedAt: new Date()
      }
    });

    await prisma.brand.update({
      where: { id: agreement.brandId },
      data: { onboardingStatus: "AGREEMENT_PENDING" }
    });

    res.json({
      id: updated.id,
      status: updated.status,
      signedPdfUrl: resolveCommercialPublicUrl(updated.signedPdfPath)
    });
  }
);

export const commercialAdminRouter = Router();
commercialAdminRouter.use(requireAuth, requireRole(["SUPER_ADMIN", "ADMIN_STAFF"]));

commercialAdminRouter.get("/workflow", async (_req, res) => {
  const [licenseRenewal, subscriptionGovernance] = await Promise.all([
    processAnnualLicenseRenewalGovernance(),
    processSubscriptionGovernance()
  ]);
  const board = await getCommercialWorkflowBoard();
  res.json({ ...board, licenseRenewal, subscriptionGovernance });
});

commercialAdminRouter.get("/brand-applications", async (req, res) => {
  const status = req.query.status as string | undefined;
  const brands = await prisma.brand.findMany({
    where: status
      ? { onboardingStatus: status as never }
      : { onboardingStatus: { not: "COMMERCIALLY_ACTIVE" } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      _count: { select: { campaigns: true, agreements: true } }
    }
  });

  res.json(
    brands.map((b) => ({
      id: b.id,
      name: b.name,
      legalName: b.legalName,
      codePrefix: b.codePrefix,
      onboardingStatus: b.onboardingStatus,
      status: b.status,
      registrationNumber: b.registrationNumber,
      vatNumber: b.vatNumber,
      primaryContactEmail: b.primaryContactEmail,
      intendedProvinces: b.intendedProvinces,
      campaignIntention: b.campaignIntention,
      createdAt: b.createdAt.toISOString(),
      campaignCount: b._count.campaigns,
      agreementCount: b._count.agreements
    }))
  );
});

const reviewBrandSchema = z.object({
  onboardingStatus: z.enum(["UNDER_APPROVAL", "AGREEMENT_PENDING", "COMMERCIALLY_ACTIVE", "SUSPENDED"]),
  internalReviewNotes: z.string().optional(),
  status: z.enum(["PENDING", "VERIFIED", "APPROVED", "ACTIVE"]).optional()
});

commercialAdminRouter.patch("/brands/:brandId/review", async (req, res) => {
  const payload = reviewBrandSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const brand = await prisma.brand.update({
    where: { id: req.params.brandId },
    data: {
      onboardingStatus: payload.data.onboardingStatus,
      ...(payload.data.internalReviewNotes !== undefined
        ? { internalReviewNotes: payload.data.internalReviewNotes }
        : {}),
      ...(payload.data.status ? { status: payload.data.status } : {})
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: req.user?.id,
      action: "BRAND_ONBOARDING_REVIEW",
      targetType: "Brand",
      targetId: brand.id,
      payload: payload.data
    }
  });

  if (payload.data.onboardingStatus === "UNDER_APPROVAL") {
    void trySendBrandLifecycleEmail(brand, (c) =>
      sendBrandVerificationApprovedEmail({
        to: c.email,
        contactName: c.name,
        brandName: brand.name
      })
    );
  }

  res.json(brand);
});

commercialAdminRouter.post("/brands/:brandId/agreements/generate", async (req, res) => {
  const brand = await prisma.brand.findUnique({
    where: { id: req.params.brandId },
    include: { campaigns: true }
  });
  if (!brand) {
    res.status(404).json({ message: "Brand not found." });
    return;
  }

  const latest = await prisma.brandAgreement.findFirst({
    where: { brandId: brand.id },
    orderBy: { version: "desc" }
  });
  const version = (latest?.version ?? 0) + 1;

  const pdfBuffer = await buildParticipationAgreementPdf({
    brand,
    agreement: { version },
    campaigns: brand.campaigns
  });

  const generatedPath = agreementGeneratedPath(brand.id, version);
  await saveCommercialPdf(generatedPath, pdfBuffer);

  const agreement = await prisma.brandAgreement.create({
    data: {
      brandId: brand.id,
      version,
      status: "AWAITING_SIGNATURE",
      generatedPdfPath: generatedPath,
      generatedAt: new Date(),
      scopeSnapshot: {
        intendedProvinces: brand.intendedProvinces,
        campaignIntention: brand.campaignIntention,
        productsInvolved: brand.productsInvolved
      }
    }
  });

  await prisma.brand.update({
    where: { id: brand.id },
    data: { onboardingStatus: "AGREEMENT_PENDING" }
  });

  for (const campaign of brand.campaigns) {
    await syncCampaignCommercialStatus(campaign.id);
  }

  const generatedPdfUrl = resolveCommercialPublicUrl(agreement.generatedPdfPath);

  void trySendBrandLifecycleEmail(brand, (c) =>
    sendBrandAgreementRequiredEmail({
      to: c.email,
      contactName: c.name,
      brandName: brand.name,
      agreementVersion: version,
      agreementPdfUrl: generatedPdfUrl
    })
  );

  res.status(201).json({
    id: agreement.id,
    version: agreement.version,
    status: agreement.status,
    generatedPdfUrl,
    primaryContactEmail: brand.primaryContactEmail
  });
});

const approveAgreementSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().optional()
});

commercialAdminRouter.post("/agreements/:agreementId/approve", async (req, res) => {
  const payload = approveAgreementSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const agreement = await prisma.brandAgreement.findUnique({
    where: { id: req.params.agreementId },
    include: { brand: { include: { campaigns: true } } }
  });
  if (!agreement) {
    res.status(404).json({ message: "Agreement not found." });
    return;
  }

  if (payload.data.approved) {
    if (agreement.status !== "UPLOADED" && agreement.status !== "AWAITING_SIGNATURE") {
      res.status(400).json({ message: "Agreement must be uploaded or awaiting signature before approval." });
      return;
    }
    const updated = await prisma.brandAgreement.update({
      where: { id: agreement.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedByUserId: req.user?.id
      }
    });
    await prisma.brand.update({
      where: { id: agreement.brandId },
      data: { onboardingStatus: "COMMERCIALLY_ACTIVE", status: "APPROVED" }
    });
    for (const c of agreement.brand.campaigns) {
      await syncCampaignCommercialStatus(c.id);
    }
    res.json({ agreement: updated });
    return;
  }

  const updated = await prisma.brandAgreement.update({
    where: { id: agreement.id },
    data: {
      status: "REJECTED",
      rejectionReason: payload.data.rejectionReason ?? "Rejected by admin."
    }
  });
  res.json({ agreement: updated });
});

commercialAdminRouter.post("/campaigns/:campaignId/invoices/setup-fee", async (req, res) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id: req.params.campaignId },
    include: { brand: true }
  });
  if (!campaign) {
    res.status(404).json({ message: "Campaign not found." });
    return;
  }

  const amount = defaultSetupFeeForCampaign(campaign);
  const invoiceNumber = await nextInvoiceNumber();
  const eftReference = `B2S-${campaign.slug.slice(0, 12).toUpperCase()}-SETUP`;

  const invoice = await prisma.campaignInvoice.create({
    data: {
      campaignId: campaign.id,
      invoiceNumber,
      invoiceType: "SETUP_FEE",
      amountZar: amount,
      status: "ISSUED",
      eftReference,
      issuedAt: new Date(),
      notes: `Activation fee (${campaign.scopeType}): ${formatZar(amount)}`
    }
  });

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { setupFeeZar: amount, commercialStatus: "AWAITING_PAYMENT" }
  });

  void trySendBrandLifecycleEmail(campaign.brand, (c) =>
    sendBrandPaymentPendingEmail({
      to: c.email,
      contactName: c.name,
      brandName: campaign.brand.name,
      campaignName: campaign.name,
      invoiceNumber,
      amountZar: formatZar(amount),
      eftReference
    })
  );

  res.status(201).json({
    invoice: {
      ...invoice,
      amountZar: Number(invoice.amountZar)
    },
    paymentInstructions: {
      method: "EFT",
      reference: eftReference,
      amountZar: amount,
      note: "Finance must verify EFT before campaign activation."
    }
  });
});

const verifyPaymentSchema = z.object({
  invoiceId: z.string().cuid(),
  verified: z.boolean()
});

commercialAdminRouter.post("/campaigns/:campaignId/verify-payment", async (req, res) => {
  const payload = verifyPaymentSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const invoice = await prisma.campaignInvoice.findUnique({
    where: { id: payload.data.invoiceId },
    include: { campaign: { include: { brand: true } } }
  });
  if (!invoice || invoice.campaignId !== req.params.campaignId) {
    res.status(404).json({ message: "Invoice not found for campaign." });
    return;
  }

  if (!payload.data.verified) {
    await prisma.campaignInvoice.update({
      where: { id: invoice.id },
      data: { status: "VOID" }
    });
    res.json({ message: "Invoice voided." });
    return;
  }

  await prisma.campaignInvoice.update({
    where: { id: invoice.id },
    data: {
      status: "VERIFIED",
      verifiedAt: new Date(),
      verifiedByUserId: req.user?.id
    }
  });

  const brandId = invoice.campaign.brandId;
  const brandUpdate: Record<string, unknown> = {};

  if (invoice.invoiceType === "SETUP_FEE") {
    brandUpdate.activationFeePaid = true;
    await prisma.campaign.update({
      where: { id: req.params.campaignId },
      data: { paymentVerifiedAt: new Date() }
    });
  }

  if (invoice.invoiceType === "SAAS_SUBSCRIPTION") {
    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    const wasInactive =
      brand?.subscriptionStatus === "PAST_DUE" || brand?.subscriptionStatus === "SUSPENDED";
    const cycleMonths =
      brand?.billingCycle === "QUARTERLY" ? 3 : brand?.billingCycle === "ANNUAL" ? 12 : 1;
    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + cycleMonths);
    brandUpdate.subscriptionStatus = "ACTIVE";
    brandUpdate.subscriptionStartDate = start;
    brandUpdate.subscriptionEndDate = end;
    brandUpdate.gracePeriodUntil = null;

    if (wasInactive && brand) {
      void notifySubscriptionReactivated(brandId, Number(invoice.amountZar));
      const campaigns = await prisma.campaign.findMany({
        where: { brandId },
        select: { id: true }
      });
      for (const c of campaigns) {
        await syncCampaignCommercialStatus(c.id);
      }
    }
  }

  if (Object.keys(brandUpdate).length > 0) {
    await prisma.brand.update({ where: { id: brandId }, data: brandUpdate });
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: req.params.campaignId } });
  await syncCampaignCommercialStatus(req.params.campaignId);

  void trySendBrandLifecycleEmail(invoice.campaign.brand, (c) =>
    sendBrandPaymentVerifiedEmail({
      to: c.email,
      contactName: c.name,
      brandName: invoice.campaign.brand.name,
      campaignName: invoice.campaign.name,
      invoiceNumber: invoice.invoiceNumber,
      amountZar: formatZar(Number(invoice.amountZar))
    })
  );

  res.json({
    campaignId: campaign?.id,
    paymentVerifiedAt: campaign?.paymentVerifiedAt,
    invoiceType: invoice.invoiceType
  });
});

commercialAdminRouter.post("/campaigns/:campaignId/invoices/subscription", async (req, res) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id: req.params.campaignId },
    include: { brand: true }
  });
  if (!campaign) {
    res.status(404).json({ message: "Campaign not found." });
    return;
  }

  const stored = campaign.brand.recurringAmountZar != null ? Number(campaign.brand.recurringAmountZar) : 0;
  const fallback = defaultMonthlySubscriptionZar(campaign.scopeType).min;
  const amount = stored > 0 ? stored : fallback;
  if (amount <= 0) {
    res.status(400).json({ message: "No recurring subscription amount configured for this brand." });
    return;
  }

  const invoiceNumber = await nextInvoiceNumber();
  const eftReference = `B2S-${campaign.slug.slice(0, 10).toUpperCase()}-SUB`;

  const invoice = await prisma.campaignInvoice.create({
    data: {
      campaignId: campaign.id,
      invoiceNumber,
      invoiceType: "SAAS_SUBSCRIPTION",
      amountZar: amount,
      status: "ISSUED",
      eftReference,
      issuedAt: new Date(),
      notes: `Enterprise ESG infrastructure subscription (${campaign.brand.billingCycle}): ${formatZar(amount)}`
    }
  });

  void trySendBrandLifecycleEmail(campaign.brand, (c) =>
    sendBrandPaymentPendingEmail({
      to: c.email,
      contactName: c.name,
      brandName: campaign.brand.name,
      campaignName: campaign.name,
      invoiceNumber,
      amountZar: formatZar(amount),
      eftReference
    })
  );

  res.status(201).json({
    invoice: { ...invoice, amountZar: Number(invoice.amountZar) },
    paymentInstructions: {
      method: "EFT",
      reference: eftReference,
      amountZar: amount,
      note: "Monthly enterprise ESG infrastructure subscription — not a donation."
    }
  });
});

commercialAdminRouter.post("/campaigns/:campaignId/approve-codes", async (req, res) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id: req.params.campaignId },
    include: { _count: { select: { codes: true } } }
  });
  if (!campaign) {
    res.status(404).json({ message: "Campaign not found." });
    return;
  }
  if (campaign._count.codes === 0) {
    res.status(400).json({ message: "No codes registered for this campaign." });
    return;
  }

  const updated = await prisma.campaign.update({
    where: { id: campaign.id },
    data: { codesApprovedAt: new Date() }
  });
  await syncCampaignCommercialStatus(updated.id);
  res.json({ codesApprovedAt: updated.codesApprovedAt });
});

commercialAdminRouter.post("/campaigns/:campaignId/approve-launch", async (req, res) => {
  const gate = await assertCampaignCanGoLive(req.params.campaignId);
  if (!gate.canActivate) {
    res.status(400).json({ message: "Campaign cannot launch yet.", blockers: gate.blockers, checklist: gate.checklist });
    return;
  }

  const before = await prisma.campaign.findUnique({
    where: { id: req.params.campaignId },
    include: { brand: true }
  });

  const campaign = await prisma.campaign.update({
    where: { id: req.params.campaignId },
    data: {
      launchApprovedAt: new Date(),
      isActive: true,
      commercialStatus: "LIVE"
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: req.user?.id,
      action: "CAMPAIGN_LAUNCH_APPROVED",
      targetType: "Campaign",
      targetId: campaign.id
    }
  });

  const impact = await refreshCampaignImpactDelivered(campaign.id);
  await syncCampaignCommercialStatus(campaign.id);

  if (before && !before.launchApprovedAt && before.brand) {
    void trySendBrandLifecycleEmail(before.brand, (c) =>
      sendBrandCampaignActivatedEmail({
        to: c.email,
        contactName: c.name,
        brandName: before.brand.name,
        campaignName: campaign.name,
        partnershipLabel: campaign.partnershipLabel
      })
    );
  }

  res.json({ campaignId: campaign.id, isActive: true, commercialStatus: campaign.commercialStatus, impact });
});

const impactCommitmentSchema = z.object({
  schoolsTargeted: z.number().int().nonnegative().optional(),
  schoolsReached: z.number().int().nonnegative().optional(),
  waterPhasesCompleted: z.number().int().nonnegative().optional(),
  activeInfrastructureProjects: z.number().int().nonnegative().optional()
});

commercialAdminRouter.patch("/campaigns/:campaignId/impact-commitment", async (req, res) => {
  const payload = impactCommitmentSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const campaign = await prisma.campaign.update({
    where: { id: req.params.campaignId },
    data: { impactCommitment: payload.data }
  });

  const delivered = await refreshCampaignImpactDelivered(campaign.id);
  res.json({ impactCommitment: campaign.impactCommitment, impactDelivered: delivered });
});

commercialAdminRouter.get("/campaigns/:campaignId/activation", async (req, res) => {
  const campaign = await loadCampaignForActivation(req.params.campaignId);
  if (!campaign) {
    res.status(404).json({ message: "Campaign not found." });
    return;
  }
  const activation = evaluateActivationGate(campaign, campaign._count?.codes ?? 0);
  const summary = await serializeCommercialCampaign(campaign, campaign._count?.codes ?? 0, activation);
  res.json({
    ...summary,
    brandSubscription: serializeBrandSubscription(campaign.brand),
    invoices: campaign.invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      invoiceType: inv.invoiceType,
      amountZar: Number(inv.amountZar),
      status: inv.status,
      eftReference: inv.eftReference,
      issuedAt: inv.issuedAt?.toISOString() ?? null,
      verifiedAt: inv.verifiedAt?.toISOString() ?? null
    }))
  });
});

commercialAdminRouter.post("/governance/subscriptions/run", async (_req, res) => {
  const result = await processSubscriptionGovernance();
  res.json(result);
});

commercialAdminRouter.post("/campaigns/:campaignId/validate-codes", async (req, res) => {
  const body = z.object({ codes: z.array(z.string().min(4)).min(1) }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ message: "Validation failed.", issues: body.error.flatten() });
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

  const { valid, invalid } = filterCodesForBrand(body.data.codes, campaign.brand.codePrefix);
  res.json({
    brandPrefix: campaign.brand.codePrefix,
    validCount: valid.length,
    invalidCount: invalid.length,
    invalidSample: invalid.slice(0, 20)
  });
});
