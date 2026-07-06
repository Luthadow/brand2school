import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { buildSchoolNeedsEngine, summarizeNeedsEngine } from "../schools/schoolNeedsEngine.js";
import {
  countValidSubmissionsForSchool,
  persistSchoolInfrastructure,
  type InfrastructureItemPatch
} from "../schools/syncSchoolInfrastructure.js";
import { PHASE_COMPLETION_THRESHOLD } from "../schools/infrastructureProgress.js";
import { getAdminSchoolProfile } from "./schoolProfile.js";

const itemPatchSchema = z.object({
  key: z.string().min(2),
  verificationStatus: z.enum(["unverified", "pending", "verified"]).optional(),
  current: z.union([z.coerce.number(), z.string()]).optional(),
  completionPercent: z.coerce.number().min(0).max(100).optional(),
  verifiedAt: z.string().datetime().nullable().optional()
});

const patchInfrastructureSchema = z.object({
  itemPatches: z.array(itemPatchSchema).optional(),
  currentPhase: z.coerce.number().int().min(1).max(5).optional(),
  phaseHistory: z.record(z.string(), z.string()).optional(),
  recalculate: z.boolean().optional(),
  adminNote: z.string().max(500).optional()
});

export const adminSchoolInfrastructureRouter = Router();

adminSchoolInfrastructureRouter.get("/:schoolId", async (req, res) => {
  const profile = await getAdminSchoolProfile(req.params.schoolId);
  if (!profile) {
    res.status(404).json({ message: "School not found." });
    return;
  }
  res.json(profile);
});

adminSchoolInfrastructureRouter.get("/:schoolId/infrastructure", async (req, res) => {
  const school = await prisma.school.findUnique({ where: { id: req.params.schoolId } });
  if (!school) {
    res.status(404).json({ message: "School not found." });
    return;
  }

  const validSubmissions = await countValidSubmissionsForSchool(school.id);
  const { development } = await persistSchoolInfrastructure({
    school: {
      id: school.id,
      name: school.name,
      province: school.province,
      district: school.district,
      principalName: school.principalName,
      contactEmail: school.contactEmail,
      currentPhase: school.currentPhase,
      developmentTier: school.developmentTier,
      developmentScores: school.developmentScores,
      phaseHistory: school.phaseHistory,
      infrastructureItems: school.infrastructureItems,
      annualCycleYear: school.annualCycleYear,
      annualCycleFocus: school.annualCycleFocus
    },
    validSubmissions,
    notifyGovernance: false
  });

  const needs = buildSchoolNeedsEngine(development);

  res.json({
    school: {
      id: school.id,
      name: school.name,
      province: school.province,
      district: school.district,
      status: school.status
    },
    validSubmissions,
    phaseCompletionThreshold: PHASE_COMPLETION_THRESHOLD,
    development: {
      currentPhase: development.currentPhase,
      tier: development.tier,
      tierLabel: development.tierLabel,
      nationalScore: development.nationalScore,
      phases: development.phases,
      infrastructure: development.infrastructure
    },
    needs,
    needsSummary: summarizeNeedsEngine(needs)
  });
});

adminSchoolInfrastructureRouter.patch("/:schoolId/infrastructure", async (req, res) => {
  const payload = patchInfrastructureSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const school = await prisma.school.findUnique({ where: { id: req.params.schoolId } });
  if (!school) {
    res.status(404).json({ message: "School not found." });
    return;
  }

  const validSubmissions = await countValidSubmissionsForSchool(school.id);
  const itemPatches = payload.data.recalculate ? undefined : (payload.data.itemPatches as InfrastructureItemPatch[] | undefined);

  const result = await persistSchoolInfrastructure({
    school: {
      id: school.id,
      name: school.name,
      province: school.province,
      district: school.district,
      principalName: school.principalName,
      contactEmail: school.contactEmail,
      currentPhase: school.currentPhase,
      developmentTier: school.developmentTier,
      developmentScores: school.developmentScores,
      phaseHistory: school.phaseHistory,
      infrastructureItems: school.infrastructureItems,
      annualCycleYear: school.annualCycleYear,
      annualCycleFocus: school.annualCycleFocus
    },
    validSubmissions,
    itemPatches,
    adminPhase: {
      currentPhase: payload.data.currentPhase,
      phaseHistory: payload.data.phaseHistory
    },
    notifyGovernance: true,
    actorId: req.user?.id,
    auditAction: "SCHOOL_INFRASTRUCTURE_ADMIN_UPDATE",
    auditPayload: {
      itemPatchCount: itemPatches?.length ?? 0,
      recalculate: payload.data.recalculate ?? false,
      adminNote: payload.data.adminNote,
      governanceEmailsSent: 0
    }
  });

  const needs = buildSchoolNeedsEngine(result.development);

  res.json({
    message: result.changed ? "Infrastructure updated." : "No infrastructure changes detected.",
    changed: result.changed,
    governanceNotified: result.governanceNotified,
    development: {
      currentPhase: result.development.currentPhase,
      tier: result.development.tier,
      nationalScore: result.development.nationalScore,
      phaseTransition: result.development.phaseTransition,
      infrastructure: result.development.infrastructure
    },
    needs,
    needsSummary: summarizeNeedsEngine(needs)
  });
});
