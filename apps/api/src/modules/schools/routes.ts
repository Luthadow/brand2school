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
import {
  buildSchoolPortalReportPdf,
  isSchoolReportModule,
  schoolReportContentDisposition
} from "./schoolPortalReportPdfs.js";
import { analyticsRateLimit, registrationRateLimit } from "../../middleware/rateLimit.js";
import { getOrCreateSchoolVerification } from "./schoolVerification/verificationGate.js";
import { assertDocumentsReadyForClaim } from "./schoolVerification/verificationClaimGate.js";
import { serializeSchoolVerification } from "./schoolVerification/serializeSchoolVerification.js";
import { submitSchoolVerificationPacket } from "./schoolVerification/submitSchoolVerification.js";
import { parseDocumentDeferrals } from "./schoolVerification/documentDeferrals.js";
import {
  buildSchoolPublicProfile,
  mergePublicProfilePatch,
  publicProfilePatchSchema
} from "./schoolPublicProfile.js";
import { persistSchoolLogo } from "../../lib/schoolLogo.js";
import {
  createSchoolSubmittedNeed,
  listSchoolSubmittedNeeds,
  serializeSubmittedNeed
} from "./schoolSubmittedNeeds.js";
import {
  getSchoolLeaderboard,
  getSchoolLeaderboardsDashboard,
  type LeaderboardPeriod,
  type LeaderboardScope
} from "./schoolLeaderboards.js";
import { buildSchoolCommunityHub } from "./schoolCommunityHub.js";
import { buildSchoolPeopleHub } from "./schoolPeopleHub.js";
import {
  createSchoolVolunteer,
  listSchoolVolunteers,
  serializeVolunteer,
  updateSchoolVolunteer
} from "./schoolVolunteers.js";
import {
  assignVolunteerToEvent,
  createSchoolEvent,
  EVENT_TYPES,
  listSchoolEvents,
  serializeEvent,
  updateSchoolEvent
} from "./schoolEvents.js";
import { buildSchoolEnterpriseHub } from "./schoolEnterpriseHub.js";
import {
  createSchoolAlumni,
  listSchoolAlumni,
  serializeAlumni,
  updateSchoolAlumni
} from "./schoolAlumni.js";
import {
  CHALLENGE_TYPES,
  createSchoolEnterpriseProject,
  createSchoolInnovationChallenge,
  listSchoolEnterpriseProjects,
  listSchoolInnovationChallenges,
  PROJECT_TYPES,
  serializeChallenge,
  serializeProject,
  updateSchoolEnterpriseProject,
  updateSchoolInnovationChallenge
} from "./schoolEnterprise.js";
import { buildSchoolCrmHub } from "./schoolCrmHub.js";
import {
  ACTIVITY_TYPE_LABELS,
  createSchoolCrmActivity,
  listSchoolCrmActivities,
  serializeCrmActivity,
  updateSchoolCrmActivity
} from "./schoolCrmActivities.js";
import {
  CONTACT_TYPE_LABELS,
  createSchoolCrmContact,
  listSchoolCrmContacts,
  serializeCrmContact,
  updateSchoolCrmContact
} from "./schoolCrmContacts.js";
import {
  createSchoolCrmTask,
  listSchoolCrmTasks,
  serializeCrmTask,
  updateSchoolCrmTask
} from "./schoolCrmTasks.js";

const verificationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 }
});

const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
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

  const claimGate = await assertDocumentsReadyForClaim(school.id);
  if (!claimGate.ok) {
    res.status(403).json({
      message: claimGate.message,
      outstandingDocuments: claimGate.outstanding
    });
    return;
  }

  await createSchoolSubmittedNeed(school.id, payload.data);

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
    message: "Need submitted for review. Brands can view your priority needs once approved.",
    need: { status: "SUBMITTED", ...payload.data }
  });
});

schoolsRouter.get("/needs", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const rows = await listSchoolSubmittedNeeds(school.id);
  res.json({ needs: rows.map(serializeSubmittedNeed) });
});

schoolsRouter.get("/profile", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const row = await prisma.school.findUniqueOrThrow({ where: { id: school.id } });
  res.json({
    school: {
      id: row.id,
      name: row.name,
      schoolCode: row.schoolCode,
      province: row.province,
      district: row.district,
      principalName: row.principalName,
      contactEmail: row.contactEmail
    },
    profile: buildSchoolPublicProfile(row)
  });
});

schoolsRouter.patch("/profile", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const payload = publicProfilePatchSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }

  const existing = await prisma.school.findUniqueOrThrow({ where: { id: school.id } });
  const mergedProfile = mergePublicProfilePatch(existing.publicProfile, payload.data);

  const scalar: Record<string, unknown> = { publicProfile: mergedProfile };
  if (payload.data.principalName !== undefined) scalar.principalName = payload.data.principalName;
  if (payload.data.contactEmail !== undefined) scalar.contactEmail = payload.data.contactEmail;
  if (payload.data.websiteUrl !== undefined) scalar.websiteUrl = payload.data.websiteUrl;
  if (payload.data.publicPhone !== undefined) scalar.publicPhone = payload.data.publicPhone;
  if (payload.data.quintile !== undefined) scalar.quintile = payload.data.quintile;
  if (payload.data.teacherCount !== undefined) scalar.teacherCount = payload.data.teacherCount;
  if (payload.data.gpsLat !== undefined) scalar.gpsLat = payload.data.gpsLat;
  if (payload.data.gpsLng !== undefined) scalar.gpsLng = payload.data.gpsLng;

  const updated = await prisma.school.update({
    where: { id: school.id },
    data: scalar
  });

  res.json({
    message: "Profile updated.",
    profile: buildSchoolPublicProfile(updated)
  });
});

schoolsRouter.post(
  "/profile/logo",
  requireAuth,
  requireRole(["SCHOOL_ADMIN"]),
  logoUpload.single("logo"),
  async (req, res) => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized." });
      return;
    }
    const school = await getSchoolForUser(req.user.id);
    if (!school) {
      res.status(404).json({ message: "No school linked to this account." });
      return;
    }
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "Upload a logo image." });
      return;
    }
    try {
      await persistSchoolLogo(school.id, {
        buffer: file.buffer,
        mimetype: file.mimetype,
        size: file.size
      });
      const updated = await prisma.school.findUniqueOrThrow({ where: { id: school.id } });
      res.json({
        message: "Logo uploaded.",
        profile: buildSchoolPublicProfile(updated)
      });
    } catch (err) {
      res.status(400).json({
        message: err instanceof Error ? err.message : "Could not save logo."
      });
    }
  }
);

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

const leaderboardQuerySchema = z.object({
  period: z.enum(["today", "week", "month", "all"]).default("month"),
  scope: z.enum(["national", "province", "district"]).default("national"),
  limit: z.coerce.number().int().min(5).max(50).optional()
});

schoolsRouter.get("/leaderboards", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }

  const query = leaderboardQuerySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ message: "Invalid query.", issues: query.error.flatten() });
    return;
  }

  const board = await getSchoolLeaderboard({
    schoolId: school.id,
    province: school.province,
    district: school.district,
    period: query.data.period as LeaderboardPeriod,
    scope: query.data.scope as LeaderboardScope,
    limit: query.data.limit
  });
  res.json({ leaderboard: board });
});

schoolsRouter.get("/leaderboards/dashboard", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const dashboard = await getSchoolLeaderboardsDashboard({
    schoolId: school.id,
    province: school.province,
    district: school.district
  });
  res.json({ leaderboards: dashboard });
});

const createVolunteerSchema = z.object({
  fullName: z.string().min(2),
  role: z.string().min(2),
  phone: z.string().min(8).optional().nullable(),
  email: z.string().email().optional().nullable(),
  skills: z.string().max(500).optional().nullable(),
  hoursLogged: z.coerce.number().int().min(0).optional(),
  notes: z.string().max(1000).optional().nullable()
});

const updateVolunteerSchema = createVolunteerSchema
  .partial()
  .extend({ status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional() });

const createEventSchema = z.object({
  title: z.string().min(4),
  description: z.string().max(2000).optional().nullable(),
  eventType: z.string().min(2),
  location: z.string().max(200).optional().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional().nullable(),
  volunteerSlots: z.coerce.number().int().min(0).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "COMPLETED", "CANCELLED"]).optional()
});

const updateEventSchema = createEventSchema.partial();

const assignVolunteerSchema = z.object({
  volunteerId: z.string().min(1),
  role: z.string().max(100).optional()
});

schoolsRouter.get("/people", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const peopleHub = await buildSchoolPeopleHub(school.id);
  res.json({ peopleHub, eventTypes: EVENT_TYPES });
});

schoolsRouter.get("/volunteers", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const rows = await listSchoolVolunteers(school.id);
  res.json({ volunteers: rows.map(serializeVolunteer) });
});

schoolsRouter.post("/volunteers", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const payload = createVolunteerSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const row = await createSchoolVolunteer(school.id, payload.data);
  res.status(201).json({ volunteer: serializeVolunteer({ ...row, _count: { assignments: 0 } }) });
});

schoolsRouter.patch("/volunteers/:id", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const payload = updateVolunteerSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const row = await updateSchoolVolunteer(school.id, req.params.id, payload.data);
  if (!row) {
    res.status(404).json({ message: "Volunteer not found." });
    return;
  }
  const full = await listSchoolVolunteers(school.id);
  const match = full.find((v) => v.id === row.id);
  res.json({ volunteer: match ? serializeVolunteer(match) : null });
});

schoolsRouter.get("/events", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const rows = await listSchoolEvents(school.id);
  res.json({ events: rows.map(serializeEvent), eventTypes: EVENT_TYPES });
});

schoolsRouter.post("/events", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const payload = createEventSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const row = await createSchoolEvent(school.id, payload.data);
  const rows = await listSchoolEvents(school.id);
  const match = rows.find((e) => e.id === row.id);
  res.status(201).json({ event: match ? serializeEvent(match) : null });
});

schoolsRouter.patch("/events/:id", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const payload = updateEventSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const row = await updateSchoolEvent(school.id, req.params.id, payload.data);
  if (!row) {
    res.status(404).json({ message: "Event not found." });
    return;
  }
  const rows = await listSchoolEvents(school.id);
  const match = rows.find((e) => e.id === row.id);
  res.json({ event: match ? serializeEvent(match) : null });
});

schoolsRouter.post(
  "/events/:id/volunteers",
  requireAuth,
  requireRole(["SCHOOL_ADMIN"]),
  async (req, res) => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized." });
      return;
    }
    const payload = assignVolunteerSchema.safeParse(req.body);
    if (!payload.success) {
      res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
      return;
    }
    const school = await getSchoolForUser(req.user.id);
    if (!school) {
      res.status(404).json({ message: "No school linked to this account." });
      return;
    }
    const result = await assignVolunteerToEvent(
      school.id,
      req.params.id,
      payload.data.volunteerId,
      payload.data.role
    );
    if (!result) {
      res.status(404).json({ message: "Event or volunteer not found." });
      return;
    }
    const rows = await listSchoolEvents(school.id);
    const match = rows.find((e) => e.id === req.params.id);
    res.json({ event: match ? serializeEvent(match) : null });
  }
);

const createAlumniSchema = z.object({
  fullName: z.string().min(2),
  graduationYear: z.coerce.number().int().min(1950).max(2100).optional().nullable(),
  profession: z.string().max(120).optional().nullable(),
  company: z.string().max(120).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(8).optional().nullable(),
  linkedInUrl: z.string().url().optional().nullable(),
  role: z
    .enum(["ALUMNI", "BUSINESS_OWNER", "PROFESSIONAL", "SPONSOR", "MENTOR", "DONOR", "EMPLOYER"])
    .optional(),
  offering: z.string().max(500).optional().nullable()
});

const updateAlumniSchema = createAlumniSchema
  .partial()
  .extend({ status: z.enum(["ACTIVE", "INACTIVE"]).optional() });

const createProjectSchema = z.object({
  title: z.string().min(4),
  description: z.string().max(2000).optional().nullable(),
  projectType: z.enum(["PRODUCT", "PITCH", "STARTUP_CLUB", "MINI_COMPANY", "CHALLENGE_ENTRY"]),
  studentLead: z.string().min(2),
  gradeLevel: z.string().max(40).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  status: z.enum(["IDEA", "ACTIVE", "COMPETING", "AWARDED", "ARCHIVED"]).optional(),
  revenueZar: z.coerce.number().int().min(0).optional(),
  seekingSponsor: z.boolean().optional(),
  challengeId: z.string().optional().nullable()
});

const updateProjectSchema = createProjectSchema.partial();

const createChallengeSchema = z.object({
  title: z.string().min(4),
  description: z.string().max(2000).optional().nullable(),
  challengeType: z.string().min(2),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional().nullable(),
  prizeDescription: z.string().max(500).optional().nullable(),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "COMPLETED"]).optional(),
  maxEntries: z.coerce.number().int().min(0).optional()
});

const updateChallengeSchema = createChallengeSchema.partial();

schoolsRouter.get("/enterprise", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const enterpriseHub = await buildSchoolEnterpriseHub(school.id);
  res.json({ enterpriseHub, projectTypes: PROJECT_TYPES, challengeTypes: CHALLENGE_TYPES });
});

schoolsRouter.get("/alumni", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const rows = await listSchoolAlumni(school.id);
  res.json({ alumni: rows.map(serializeAlumni) });
});

schoolsRouter.post("/alumni", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const payload = createAlumniSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const row = await createSchoolAlumni(school.id, payload.data);
  res.status(201).json({ alumni: serializeAlumni(row) });
});

schoolsRouter.patch("/alumni/:id", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const payload = updateAlumniSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const row = await updateSchoolAlumni(school.id, req.params.id, payload.data);
  if (!row) {
    res.status(404).json({ message: "Alumni record not found." });
    return;
  }
  res.json({ alumni: serializeAlumni(row) });
});

schoolsRouter.get("/enterprise/projects", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const rows = await listSchoolEnterpriseProjects(school.id);
  res.json({ projects: rows.map(serializeProject), projectTypes: PROJECT_TYPES });
});

schoolsRouter.post("/enterprise/projects", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const payload = createProjectSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const row = await createSchoolEnterpriseProject(school.id, payload.data);
  if (!row) {
    res.status(404).json({ message: "Challenge not found." });
    return;
  }
  const rows = await listSchoolEnterpriseProjects(school.id);
  const match = rows.find((p) => p.id === row.id);
  res.status(201).json({ project: match ? serializeProject(match) : null });
});

schoolsRouter.patch(
  "/enterprise/projects/:id",
  requireAuth,
  requireRole(["SCHOOL_ADMIN"]),
  async (req, res) => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized." });
      return;
    }
    const payload = updateProjectSchema.safeParse(req.body);
    if (!payload.success) {
      res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
      return;
    }
    const school = await getSchoolForUser(req.user.id);
    if (!school) {
      res.status(404).json({ message: "No school linked to this account." });
      return;
    }
    const row = await updateSchoolEnterpriseProject(school.id, req.params.id, payload.data);
    if (!row) {
      res.status(404).json({ message: "Project not found." });
      return;
    }
    const rows = await listSchoolEnterpriseProjects(school.id);
    const match = rows.find((p) => p.id === row.id);
    res.json({ project: match ? serializeProject(match) : null });
  }
);

schoolsRouter.get("/enterprise/challenges", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const rows = await listSchoolInnovationChallenges(school.id);
  res.json({ challenges: rows.map(serializeChallenge), challengeTypes: CHALLENGE_TYPES });
});

schoolsRouter.post("/enterprise/challenges", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const payload = createChallengeSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const row = await createSchoolInnovationChallenge(school.id, payload.data);
  const rows = await listSchoolInnovationChallenges(school.id);
  const match = rows.find((c) => c.id === row.id);
  res.status(201).json({ challenge: match ? serializeChallenge(match) : null });
});

schoolsRouter.patch(
  "/enterprise/challenges/:id",
  requireAuth,
  requireRole(["SCHOOL_ADMIN"]),
  async (req, res) => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized." });
      return;
    }
    const payload = updateChallengeSchema.safeParse(req.body);
    if (!payload.success) {
      res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
      return;
    }
    const school = await getSchoolForUser(req.user.id);
    if (!school) {
      res.status(404).json({ message: "No school linked to this account." });
      return;
    }
    const row = await updateSchoolInnovationChallenge(school.id, req.params.id, payload.data);
    if (!row) {
      res.status(404).json({ message: "Challenge not found." });
      return;
    }
    const rows = await listSchoolInnovationChallenges(school.id);
    const match = rows.find((c) => c.id === row.id);
    res.json({ challenge: match ? serializeChallenge(match) : null });
  }
);

const createCrmContactSchema = z.object({
  fullName: z.string().min(2),
  organization: z.string().max(120).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(8).optional().nullable(),
  contactType: z.enum(["BRAND", "PARENT", "SGB", "DONOR", "SUPPORT", "PARTNER", "OTHER"]).optional(),
  notes: z.string().max(1000).optional().nullable()
});

const updateCrmContactSchema = createCrmContactSchema.partial();

const createCrmActivitySchema = z.object({
  activityType: z.enum(["MEETING", "CALL", "EMAIL", "SUPPORT", "NOTE", "DOCUMENT", "CAMPAIGN", "RENEWAL"]),
  title: z.string().min(3),
  summary: z.string().max(2000).optional().nullable(),
  occurredAt: z.coerce.date(),
  contactId: z.string().optional().nullable()
});

const updateCrmActivitySchema = createCrmActivitySchema.partial();

const createCrmTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().max(2000).optional().nullable(),
  dueAt: z.coerce.date().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  contactId: z.string().optional().nullable()
});

const updateCrmTaskSchema = createCrmTaskSchema
  .partial()
  .extend({ status: z.enum(["OPEN", "DONE", "CANCELLED"]).optional() });

schoolsRouter.get("/crm", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const crmHub = await buildSchoolCrmHub(school.id);
  res.json({ crmHub, contactTypes: CONTACT_TYPE_LABELS, activityTypes: ACTIVITY_TYPE_LABELS });
});

schoolsRouter.get("/crm/contacts", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const rows = await listSchoolCrmContacts(school.id);
  res.json({ contacts: rows.map(serializeCrmContact) });
});

schoolsRouter.post("/crm/contacts", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const payload = createCrmContactSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const row = await createSchoolCrmContact(school.id, payload.data);
  const rows = await listSchoolCrmContacts(school.id);
  const match = rows.find((c) => c.id === row.id);
  res.status(201).json({ contact: match ? serializeCrmContact(match) : null });
});

schoolsRouter.patch("/crm/contacts/:id", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const payload = updateCrmContactSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const row = await updateSchoolCrmContact(school.id, req.params.id, payload.data);
  if (!row) {
    res.status(404).json({ message: "Contact not found." });
    return;
  }
  const rows = await listSchoolCrmContacts(school.id);
  const match = rows.find((c) => c.id === row.id);
  res.json({ contact: match ? serializeCrmContact(match) : null });
});

schoolsRouter.get("/crm/activities", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const rows = await listSchoolCrmActivities(school.id);
  res.json({ activities: rows.map(serializeCrmActivity), activityTypes: ACTIVITY_TYPE_LABELS });
});

schoolsRouter.post("/crm/activities", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const payload = createCrmActivitySchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const row = await createSchoolCrmActivity(school.id, payload.data);
  if (!row) {
    res.status(404).json({ message: "Contact not found." });
    return;
  }
  const rows = await listSchoolCrmActivities(school.id);
  const match = rows.find((a) => a.id === row.id);
  res.status(201).json({ activity: match ? serializeCrmActivity(match) : null });
});

schoolsRouter.patch("/crm/activities/:id", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const payload = updateCrmActivitySchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const row = await updateSchoolCrmActivity(school.id, req.params.id, payload.data);
  if (!row) {
    res.status(404).json({ message: "Activity not found." });
    return;
  }
  const rows = await listSchoolCrmActivities(school.id);
  const match = rows.find((a) => a.id === row.id);
  res.json({ activity: match ? serializeCrmActivity(match) : null });
});

schoolsRouter.get("/crm/tasks", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const rows = await listSchoolCrmTasks(school.id);
  res.json({ tasks: rows.map(serializeCrmTask) });
});

schoolsRouter.post("/crm/tasks", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const payload = createCrmTaskSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const row = await createSchoolCrmTask(school.id, payload.data);
  if (!row) {
    res.status(404).json({ message: "Contact not found." });
    return;
  }
  const rows = await listSchoolCrmTasks(school.id);
  const match = rows.find((t) => t.id === row.id);
  res.status(201).json({ task: match ? serializeCrmTask(match) : null });
});

schoolsRouter.patch("/crm/tasks/:id", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const payload = updateCrmTaskSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const row = await updateSchoolCrmTask(school.id, req.params.id, payload.data);
  if (!row) {
    res.status(404).json({ message: "Task not found." });
    return;
  }
  const rows = await listSchoolCrmTasks(school.id);
  const match = rows.find((t) => t.id === row.id);
  res.json({ task: match ? serializeCrmTask(match) : null });
});

schoolsRouter.get("/community", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No school linked to this account." });
    return;
  }
  const learnerCount = await prisma.learner.count({ where: { schoolId: school.id } });
  const hub = await buildSchoolCommunityHub({
    schoolId: school.id,
    schoolName: school.name,
    schoolCode: school.schoolCode,
    whatsappPhone: school.whatsappPhone,
    province: school.province,
    district: school.district,
    learnerCount,
    organizationCategory: school.organizationCategory
  });
  res.json({ communityHub: hub });
});

schoolsRouter.get("/portal", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  try {
    const portal = await getSchoolPortal(req.user.id);
    if (!portal) {
      res.status(404).json({ message: "No organisation linked to this account." });
      return;
    }
    res.json(portal);
  } catch (err) {
    console.error("[schools/portal]", err);
    res.status(500).json({ message: "Could not load organisation portal." });
  }
});

schoolsRouter.get("/portal/reports/:module/pdf", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const module = req.params.module;
  if (!isSchoolReportModule(module)) {
    res.status(404).json({ message: "Report not found." });
    return;
  }
  try {
    const pdf = await buildSchoolPortalReportPdf(req.user.id, module);
    if (!pdf) {
      res.status(404).json({ message: "No organisation linked to this account." });
      return;
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", schoolReportContentDisposition(module));
    res.send(pdf);
  } catch (err) {
    console.error("[schools/portal/reports]", module, err);
    res.status(500).json({ message: "Could not generate PDF report." });
  }
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

