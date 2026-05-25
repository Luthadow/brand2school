import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { analyticsRateLimit } from "../../middleware/rateLimit.js";
import { getPlatformLive } from "./getPlatformLive.js";
import {
  getPlatformPartners,
  getPublicBrandBySlug,
  listPublicPartners
} from "./publicPartners.js";
import { getPublicCampaignBySlug, listPublicCampaigns } from "./publicCampaigns.js";
import { getPlatformRankings } from "./publicRankings.js";
import { getPlatformTrust } from "./publicTrust.js";
import { getPlatformCredibility } from "./getPlatformCredibility.js";
import { getPublicImpactDashboard } from "./getPublicImpactDashboard.js";
import { getBrandByVerificationCode } from "./getBrandVerification.js";
import {
  buildBrandProfileQrBySlug,
  buildCertificatePdfByCode,
  buildCertificatePdfBySlug,
  buildVerifyQrByCode
} from "./brandCertificateHandlers.js";
import {
  createProvinceNomination,
  createProvinceNominationSchema,
  listProvinceNominationOptions,
  listProvinceNominations
} from "./provinceNominations.js";
import { platformLiveStreamHandler } from "./liveStream.js";
import { requireInternalApiKey } from "../../middleware/requireInternalApiKey.js";
import { bootstrapSuperAdmin } from "../../bootstrap/bootstrapSuperAdmin.js";
import { bootstrapFounderBrand } from "../../bootstrap/bootstrapFounderBrand.js";
import { backfillBrandVerification } from "../../bootstrap/backfillBrandVerification.js";
import { purgeDemoData } from "../../bootstrap/purgeDemoData.js";
import { readBrandLogoBuffer } from "../../lib/brandLogo.js";
import { runMailVerifyAndOptionalSend } from "../../lib/healthEmail.js";

const querySchema = z.object({
  role: z
    .enum(["SUPER_ADMIN", "ADMIN_STAFF", "SCHOOL_ADMIN", "BRAND_ADMIN", "JUDGE", "LEARNER"])
    .optional()
});

export const platformRouter = Router();

platformRouter.get("/live", analyticsRateLimit, async (_req, res) => {
  const live = await getPlatformLive();
  res.json(live);
});

/** Public brand logo PNG (stored in DB; survives Railway redeploy). */
platformRouter.get("/brand-logo/:slug", async (req, res) => {
  const brand = await prisma.brand.findFirst({
    where: {
      slug: req.params.slug,
      status: "ACTIVE",
      logoUrl: { not: null }
    },
    select: { id: true }
  });
  if (!brand) {
    res.status(404).json({ message: "Logo not found." });
    return;
  }

  const buffer = await readBrandLogoBuffer(brand.id);
  if (!buffer) {
    res.status(404).json({ message: "Logo file not found. Re-upload in brand Settings." });
    return;
  }

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(buffer);
});

/** Homepage featured logos (ACTIVE + featuredOnHome + logo). */
platformRouter.get("/partners", async (_req, res) => {
  const partners = await getPlatformPartners();
  res.json(partners);
});

/** Directory of public partner profiles. */
platformRouter.get("/partners/directory", async (_req, res) => {
  const partners = await listPublicPartners();
  res.json(partners);
});

/** PNG QR — scan to open public verification page. */
platformRouter.get("/verify/:code/qr", async (req, res) => {
  const png = await buildVerifyQrByCode(req.params.code);
  if (!png) {
    res.status(404).json({ message: "Verification code not found." });
    return;
  }
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(png);
});

/** PDF verification certificate (trusted brands only). */
platformRouter.get("/verify/:code/certificate", async (req, res) => {
  const pdf = await buildCertificatePdfByCode(req.params.code);
  if (!pdf) {
    res.status(404).json({ message: "Certificate not available for this code." });
    return;
  }
  const code = req.params.code.replace(/[^A-Za-z0-9-]/g, "");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="brand2school-certificate-${code}.pdf"`
  );
  res.send(pdf);
});

/** PNG QR — scan to open public brand profile. */
platformRouter.get("/brands/:slug/qr", async (req, res) => {
  const png = await buildBrandProfileQrBySlug(req.params.slug);
  if (!png) {
    res.status(404).json({ message: "Brand profile not found." });
    return;
  }
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(png);
});

/** PDF certificate by brand slug (trusted + code issued). */
platformRouter.get("/brands/:slug/certificate", async (req, res) => {
  const pdf = await buildCertificatePdfBySlug(req.params.slug);
  if (!pdf) {
    res.status(404).json({ message: "Certificate not available for this brand." });
    return;
  }
  const slug = req.params.slug.replace(/[^a-z0-9-]/g, "");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="brand2school-certificate-${slug}.pdf"`
  );
  res.send(pdf);
});

/** Public brand certificate lookup by verification code (e.g. R2K-26-84XQ19). */
platformRouter.get("/verify/:code", async (req, res) => {
  const profile = await getBrandByVerificationCode(req.params.code);
  if (!profile) {
    res.status(404).json({ message: "Verification code not found." });
    return;
  }
  res.json(profile);
});

platformRouter.get("/partners/:slug", async (req, res) => {
  const profile = await getPublicBrandBySlug(req.params.slug);
  if (!profile) {
    res.status(404).json({ message: "Partner not found." });
    return;
  }
  res.json(profile);
});

platformRouter.get("/campaigns", async (_req, res) => {
  const campaigns = await listPublicCampaigns();
  res.json(campaigns);
});

platformRouter.get("/campaigns/:slug", async (req, res) => {
  const campaign = await getPublicCampaignBySlug(req.params.slug);
  if (!campaign) {
    res.status(404).json({ message: "Campaign not found." });
    return;
  }
  res.json(campaign);
});

platformRouter.get("/rankings", analyticsRateLimit, async (_req, res) => {
  const rankings = await getPlatformRankings();
  res.json(rankings);
});

platformRouter.get("/trust", async (_req, res) => {
  const trust = await getPlatformTrust();
  res.json(trust);
});

platformRouter.get("/credibility", analyticsRateLimit, async (_req, res) => {
  const credibility = await getPlatformCredibility();
  res.json(credibility);
});

/** Public governance & impact transparency — aggregated metrics only. */
platformRouter.get("/impact", analyticsRateLimit, async (_req, res) => {
  const impact = await getPublicImpactDashboard();
  res.json(impact);
});

platformRouter.get("/province-options", (_req, res) => {
  res.json(listProvinceNominationOptions());
});

platformRouter.post("/province-nominations", async (req, res) => {
  const payload = createProvinceNominationSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const row = await createProvinceNomination(payload.data);
  res.status(201).json({
    message: `Thank you — ${row.provinceName} has been nominated for future brand campaigns.`,
    nomination: row
  });
});

platformRouter.get("/live/stream", analyticsRateLimit, platformLiveStreamHandler);

platformRouter.get("/overview", async (req, res) => {
  const query = querySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ message: "Invalid query parameters." });
    return;
  }

  const [schoolsRegistered, activeSchools, schoolsWithSubmissions, validSubmissions, flaggedSubmissions, activeCampaigns, openFraudFlags] =
    await Promise.all([
      prisma.school.count({ where: { status: { in: ["PENDING", "VERIFIED", "APPROVED", "ACTIVE"] } } }),
      prisma.school.count({ where: { status: "ACTIVE" } }),
      prisma.submission.findMany({
        where: { state: "VALID" },
        distinct: ["schoolId"],
        select: { schoolId: true }
      }).then((rows) => rows.length),
      prisma.submission.count({ where: { state: "VALID" } }),
      prisma.submission.count({ where: { state: "FLAGGED_FOR_REVIEW" } }),
      prisma.campaign.count({ where: { isActive: true } }),
      prisma.fraudFlag.count({ where: { status: "OPEN" } })
    ]);

  const role = query.data.role ?? "ADMIN_STAFF";
  const roleHighlights: Record<string, string[]> = {
    SUPER_ADMIN: ["System integrity", "Approval throughput", "Fraud backlog"],
    ADMIN_STAFF: ["Moderation queue", "Approval pipeline", "Operational velocity"],
    SCHOOL_ADMIN: ["School contribution", "Verified participations", "Submission validity"],
    BRAND_ADMIN: ["Campaign performance", "Code utilization", "Regional engagement"],
    JUDGE: ["Flagged entries", "Review throughput", "Scoring readiness"],
    LEARNER: ["My submissions", "My school impact", "Leaderboard position"]
  };

  res.json({
    role,
    highlights: roleHighlights[role],
    metrics: {
      schoolsRegistered,
      activeSchools,
      schoolsWithSubmissions,
      validSubmissions,
      flaggedSubmissions,
      activeCampaigns,
      openFraudFlags
    }
  });
});

const verifySmtpBodySchema = z.object({
  sendTo: z.string().email().optional()
});

/** Verify noreply SMTP on the API (optional test send). Requires INTERNAL_API_KEY. */
platformRouter.post("/verify-smtp", requireInternalApiKey, async (req, res) => {
  const parsed = verifySmtpBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ ok: false, message: "Invalid body.", issues: parsed.error.flatten() });
    return;
  }

  try {
    const result = await runMailVerifyAndOptionalSend(parsed.data.sendTo);
    if (!result.verified) {
      res.status(503).json({ ok: false, ...result });
      return;
    }
    res.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMTP verify failed.";
    res.status(500).json({ ok: false, message });
  }
});

/** Create or update super admin only (requires INTERNAL_API_KEY). */
platformRouter.post("/bootstrap-super-admin", requireInternalApiKey, async (_req, res) => {
  try {
    const result = await bootstrapSuperAdmin(prisma);
    res.json({ ok: true, message: "Super admin bootstrapped.", ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bootstrap failed.";
    res.status(500).json({ ok: false, message });
  }
});

/** Align verification codes/status for all brands (requires INTERNAL_API_KEY). */
platformRouter.post("/backfill-brand-verification", requireInternalApiKey, async (_req, res) => {
  try {
    const summary = await backfillBrandVerification(prisma);
    res.json({ ok: true, message: "Brand verification backfill complete.", ...summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Backfill failed.";
    res.status(500).json({ ok: false, message });
  }
});

/** Provision R2kay Liquid Freeze founder brand (requires INTERNAL_API_KEY). */
platformRouter.post("/bootstrap-founder-brand", requireInternalApiKey, async (req, res) => {
  try {
    const body = (req.body ?? {}) as {
      adminEmail?: string;
      adminPassword?: string;
      adminFullName?: string;
      contactPhone?: string;
    };
    const result = await bootstrapFounderBrand(prisma, body);
    res.json({
      ok: true,
      message: "Founder brand bootstrapped.",
      publicProfileUrl: `/brand/${result.slug}`,
      ...result
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Founder bootstrap failed.";
    res.status(500).json({ ok: false, message });
  }
});

/** Remove demo school, brand, campaign, and demo portal users (requires INTERNAL_API_KEY). */
platformRouter.post("/purge-demo-data", requireInternalApiKey, async (_req, res) => {
  try {
    const summary = await purgeDemoData(prisma);
    res.json({ ok: true, message: "Demo data removed.", ...summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Purge failed.";
    res.status(500).json({ ok: false, message });
  }
});
