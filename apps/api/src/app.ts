import cors from "cors";
import express from "express";
import helmet from "helmet";
import { brandUploadsDir } from "./lib/brandAssets.js";
import type { RawBodyRequest } from "./lib/whatsappWebhook.js";
import { globalRateLimit } from "./middleware/rateLimit.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { securityMiddleware } from "./middleware/security.js";
import { authRouter } from "./modules/auth/routes.js";
import { schoolsRouter } from "./modules/schools/routes.js";
import { campaignsRouter } from "./modules/campaigns/routes.js";
import { participationRouter } from "./modules/participation/routes.js";
import { learnersRouter } from "./modules/learners/routes.js";
import { whatsappRouter } from "./modules/whatsapp/routes.js";
import { adminRouter } from "./modules/admin/routes.js";
import { platformRouter } from "./modules/platform/routes.js";
import { analyticsRouter } from "./modules/analytics/routes.js";
import { contactRouter } from "./modules/contact/routes.js";
import { commercialBrandRouter, commercialPublicRouter } from "./modules/commercial/routes.js";
import { commercialUploadsDir } from "./lib/commercialStorage.js";
import { schoolVerificationUploadsDir } from "./lib/schoolVerificationStorage.js";
import { readinessCheck } from "./bootstrap/readiness.js";

export const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors());
app.use(globalRateLimit);
app.use(securityMiddleware);
app.use(requestLogger);
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as RawBodyRequest).rawBody = buf;
    }
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "brand2school-api" });
});

app.get("/health/ready", async (_req, res) => {
  const result = await readinessCheck();
  res.status(result.ok ? 200 : 503).json(result);
});

app.use(
  "/uploads/brands",
  express.static(brandUploadsDir, {
    maxAge: "7d",
    immutable: true,
    fallthrough: false
  })
);

app.use(
  "/uploads/commercial",
  express.static(commercialUploadsDir, {
    maxAge: "1d",
    fallthrough: false
  })
);

app.use(
  "/uploads/schools/verification",
  express.static(schoolVerificationUploadsDir, {
    maxAge: "1d",
    fallthrough: false
  })
);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/schools", schoolsRouter);
app.use("/api/v1/learners", learnersRouter);
app.use("/api/v1/campaigns", campaignsRouter);
app.use("/api/v1/participation", participationRouter);
app.use("/api/v1/whatsapp", whatsappRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/platform", platformRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/contact", contactRouter);
app.use("/api/v1/commercial", commercialPublicRouter);
app.use("/api/v1/commercial/brand", commercialBrandRouter);

app.use((err: Error, _req: express.Request, res: express.Response) => {
  res.status(500).json({ message: err.message || "Unexpected server error." });
});
