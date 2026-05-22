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
import {
  createProvinceNomination,
  createProvinceNominationSchema,
  listProvinceNominationOptions,
  listProvinceNominations
} from "./provinceNominations.js";
import { platformLiveStreamHandler } from "./liveStream.js";
import { requireInternalApiKey } from "../../middleware/requireInternalApiKey.js";
import { runDemoSeed } from "../../bootstrap/demoSeed.js";

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

/** Idempotent demo seed for production (requires INTERNAL_API_KEY). */
platformRouter.post("/bootstrap-demo-seed", requireInternalApiKey, async (_req, res) => {
  try {
    const summary = await runDemoSeed(prisma);
    res.json({ ok: true, message: "Demo seed applied.", ...summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Seed failed.";
    res.status(500).json({ ok: false, message });
  }
});
