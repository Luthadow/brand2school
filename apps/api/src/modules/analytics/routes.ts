import { Router } from "express";
import { z } from "zod";
import { requireAnalyticsAccess } from "../../middleware/analyticsAccess.js";
import { analyticsRateLimit } from "../../middleware/rateLimit.js";
import { buildEsgPdf } from "./esgPdf.js";
import { getBrandAnalytics } from "./getBrandAnalytics.js";
import { getBrandPortal } from "./getBrandPortal.js";
import { getBrandTrustMetrics } from "./getBrandTrustMetrics.js";

const querySchema = z.object({
  campaignId: z.string().optional()
});

export const analyticsRouter = Router();

analyticsRouter.use(analyticsRateLimit);
analyticsRouter.use(requireAnalyticsAccess);

analyticsRouter.get("/brand/portal", async (req, res) => {
  const query = querySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ message: "Invalid query parameters." });
    return;
  }

  const portal = await getBrandPortal(query.data.campaignId, req.brandId);
  res.json(portal);
});

analyticsRouter.get("/brand", async (req, res) => {
  const query = querySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ message: "Invalid query parameters." });
    return;
  }

  const analytics = await getBrandAnalytics(query.data.campaignId, req.brandId);
  res.json(analytics);
});

analyticsRouter.get("/brand/trust", async (req, res) => {
  const query = querySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ message: "Invalid query parameters." });
    return;
  }

  const trust = await getBrandTrustMetrics(query.data.campaignId, req.brandId);
  res.json(trust);
});

analyticsRouter.get("/brand/esg-report", async (req, res) => {
  const query = querySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ message: "Invalid query parameters." });
    return;
  }

  const analytics = await getBrandAnalytics(query.data.campaignId, req.brandId);
  const campaign = query.data.campaignId
    ? analytics.campaigns.find((c) => c.id === query.data.campaignId)
    : undefined;

  const pdf = await buildEsgPdf(analytics, campaign?.name);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = campaign
    ? `brand2school-esg-${campaign.name.toLowerCase().replace(/\s+/g, "-")}-${stamp}.pdf`
    : `brand2school-esg-national-${stamp}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(pdf);
});
