import { Router } from "express";
import multer from "multer";
import { z } from "zod";

import { prisma } from "../../lib/prisma.js";

import { requireAuth, requireRole } from "../../middleware/auth.js";

import { getSchoolCampaignProgress } from "../participation/services/campaignProgress.js";

import { getSchoolRankings } from "./schoolParticipation.js";
import { getNationalSchoolScores } from "./nationalSchoolScores.js";

import { registerSchool, schoolRegisterSchema, getSchoolForUser } from "./registerSchool.js";
import { getSchoolPortal } from "./getSchoolPortal.js";
import { analyticsRateLimit, registrationRateLimit } from "../../middleware/rateLimit.js";
import { getOrCreateSchoolVerification } from "./schoolVerification/verificationGate.js";
import { serializeSchoolVerification } from "./schoolVerification/serializeSchoolVerification.js";
import { submitSchoolVerificationPacket } from "./schoolVerification/submitSchoolVerification.js";
import { parseDocumentDeferrals } from "./schoolVerification/documentDeferrals.js";

const verificationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 }
});

const createSchoolSchema = z.object({

  name: z.string().min(3),

  province: z.string().min(2),

  district: z.string().min(2),

  principalName: z.string().min(2),

  contactEmail: z.string().email().optional(),

  whatsappPhone: z.string().min(8),

  schoolCode: z.string().min(6).optional()

});



export const schoolsRouter = Router();



schoolsRouter.get("/rankings", analyticsRateLimit, async (_req, res) => {

  const rankings = await getSchoolRankings(10);

  res.json({ rankings, period: "month" });

});

schoolsRouter.get("/scores", analyticsRateLimit, async (req, res) => {
  const limit = Math.min(100, Math.max(5, Number(req.query.limit) || 50));
  const scores = await getNationalSchoolScores(limit);
  res.json({
    scores,
    phaseCompletionThreshold: 80,
    message: "National school score = verified infrastructure progress across all phases (permanent, never reset)."
  });
});



schoolsRouter.post("/register", registrationRateLimit, async (req, res) => {

  const payload = schoolRegisterSchema.safeParse(req.body);

  if (!payload.success) {

    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });

    return;

  }



  const { confirmPassword: _confirm, ...data } = payload.data;

  const result = await registerSchool(data);

  res.status(result.status).json(result.payload);

});



const submitNeedSchema = z.object({
  title: z.string().min(4),
  category: z.string().min(2),
  subcategory: z.string().min(2),
  urgency: z.enum(["Critical", "High", "Medium", "Long-Term"]),
  description: z.string().min(10),
  learnerImpact: z.coerce.number().int().min(1),
  estimatedCostZar: z.coerce.number().int().min(1000)
});

schoolsRouter.post("/needs", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const payload = submitNeedSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  await prisma.auditLog.create({
    data: {
      actorId: req.user.id,
      action: "SCHOOL_NEED_SUBMITTED",
      targetType: "School",
      targetId: school.id,
      payload: { schoolId: school.id, ...payload.data }
    }
  });
  res.status(201).json({
    message: "Need submitted for review.",
    need: { id: `need-${Date.now()}`, status: "SUBMITTED", ...payload.data }
  });
});

schoolsRouter.get("/verification", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const verification = await getOrCreateSchoolVerification(school.id);
  res.json({ verification: serializeSchoolVerification(verification, school.organizationCategory) });
});

schoolsRouter.post(
  "/verification/submit",
  requireAuth,
  requireRole(["SCHOOL_ADMIN"]),
  verificationUpload.any(),
  async (req, res) => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized." });
      return;
    }
    const school = await getSchoolForUser(req.user.id);
    if (!school) {
      res.status(404).json({ message: "No organisation linked to this account." });
      return;
    }

    const uploaded = (req.files as Array<{ fieldname: string; buffer: Buffer; mimetype: string }> | undefined) ?? [];
    const files: Record<string, { buffer: Buffer; mimetype: string }> = {};
    for (const file of uploaded) {
      files[file.fieldname] = { buffer: file.buffer, mimetype: file.mimetype };
    }

    const registrationNumber =
      typeof req.body?.registrationNumber === "string" ? req.body.registrationNumber : undefined;
    const emisNumber = typeof req.body?.emisNumber === "string" ? req.body.emisNumber : undefined;
    const centreType = typeof req.body?.centreType === "string" ? req.body.centreType : "";
    const registrationDeferred =
      req.body?.registrationDeferred === true ||
      req.body?.registrationDeferred === "true" ||
      req.body?.registrationDeferred === "1";

    let documentDeferrals = parseDocumentDeferrals(undefined);
    if (typeof req.body?.documentDeferrals === "string" && req.body.documentDeferrals.trim()) {
      try {
        documentDeferrals = parseDocumentDeferrals(JSON.parse(req.body.documentDeferrals));
      } catch {
        res.status(400).json({ message: "Invalid document deferrals payload." });
        return;
      }
    }

    const result = await submitSchoolVerificationPacket({
      schoolId: school.id,
      centreType,
      registrationNumber,
      emisNumber,
      registrationDeferred,
      documentDeferrals,
      files
    });

    if (!result.ok) {
      res.status(result.status).json({ message: result.message });
      return;
    }

    res.json({ message: "Verification packet submitted for review.", verification: result.verification });
  }
);

schoolsRouter.get("/portal", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const portal = await getSchoolPortal(req.user.id);
  if (!portal) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  res.json(portal);
});

schoolsRouter.get("/me", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {

  if (!req.user) {

    res.status(401).json({ message: "Unauthorized." });

    return;

  }



  const school = await getSchoolForUser(req.user.id);

  if (!school) {

    res.status(404).json({ message: "No school linked to this account." });

    return;

  }



  const validSubmissions = await prisma.submission.count({

    where: { schoolId: school.id, state: "VALID" }

  });



  const flaggedSubmissions = await prisma.submission.count({

    where: { schoolId: school.id, state: "FLAGGED_FOR_REVIEW" }

  });



  const activeCampaigns = await prisma.campaign.findMany({

    where: { isActive: true },

    include: { brand: { select: { name: true } } },

    orderBy: { name: "asc" }

  });



  const campaignProgress = await Promise.all(

    activeCampaigns.map(async (campaign) => ({

      id: campaign.id,

      name: campaign.name,

      slug: campaign.slug,

      brandName: campaign.brand.name,

      category: campaign.category,

      infrastructureGoal: campaign.infrastructureGoal,

      ...(await getSchoolCampaignProgress(school.id, campaign.id, campaign.targetSubmissions))

    }))

  );



  const rankings = await getSchoolRankings(10);

  const schoolRank = rankings.find((r: { schoolId: string }) => r.schoolId === school.id) ?? null;



  res.json({

    school: {

      id: school.id,

      name: school.name,

      schoolCode: school.schoolCode,

      status: school.status,

      province: school.province,

      district: school.district,

      principalName: school.principalName,

      contactEmail: school.contactEmail,

      whatsappPhone: school.whatsappPhone

    },

    metrics: {

      validSubmissions,

      flaggedSubmissions,

      activeCampaigns: activeCampaigns.length

    },

    campaignProgress,

    ranking: schoolRank,

    topSchoolsThisMonth: rankings

  });

});



schoolsRouter.post(

  "/",

  requireAuth,

  requireRole(["SUPER_ADMIN", "ADMIN_STAFF", "SCHOOL_ADMIN"]),

  async (req, res) => {

    const payload = createSchoolSchema.safeParse(req.body);

    if (!payload.success) {

      res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });

      return;

    }



    const { generateSchoolCode } = await import("../../lib/codes.js");

    const { normalizePhone } = await import("../../lib/phones.js");



    const school = await prisma.school.create({

      data: {

        name: payload.data.name,

        province: payload.data.province,

        district: payload.data.district,

        principalName: payload.data.principalName,

        contactEmail: payload.data.contactEmail,

        whatsappPhone: normalizePhone(payload.data.whatsappPhone),

        schoolCode: payload.data.schoolCode ?? generateSchoolCode(payload.data.name, payload.data.province)

      }

    });

    res.status(201).json(school);

  }

);



schoolsRouter.get("/:id/dashboard", requireAuth, async (req, res) => {

  const school = await prisma.school.findUnique({

    where: { id: req.params.id }

  });



  if (!school) {

    res.status(404).json({ message: "School not found." });

    return;

  }



  const validSubmissions = await prisma.submission.count({

    where: { schoolId: school.id, state: "VALID" }

  });



  res.json({

    school,

    metrics: { validSubmissions }

  });

});

