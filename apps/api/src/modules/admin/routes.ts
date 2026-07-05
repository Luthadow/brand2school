import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { buildAuditWhere, enqueueAuditExportJob } from "./exportJobs.js";
import {
  notifyBrandActivatedIfNeeded,
  notifySchoolActivatedIfNeeded,
  queueBrandActivationsFromSnapshots,
  queueSchoolActivationsFromSnapshots
} from "../../lib/activationEmails.js";
import { adminBrandRouter } from "./brandRoutes.js";
import { adminSchoolInfrastructureRouter } from "./schoolInfrastructure.js";
import { adminSchoolVerificationRouter } from "./schoolVerification.js";
import {
  assertSchoolVerificationApproved,
  schoolStatusRequiresVerificationApproval
} from "../schools/schoolVerification/verificationGate.js";
import { commercialAdminRouter } from "../commercial/routes.js";
import { getPlatformExecutiveAnalytics } from "../analytics/getPlatformExecutiveAnalytics.js";
import { getAdminPlatformSnapshot } from "./platformSnapshot.js";
import { buildAdminReportPdf, adminReportContentDisposition, type AdminReportModule } from "./adminReportPdfs.js";
import { listVerifiedSchools } from "./verifiedSchools.js";
import {
  sendVerifiedSchoolProgressEmail,
  sendVerifiedSchoolWelcomeEmail
} from "./verifiedSchoolEmails.js";
import { listProvinceNominations } from "../platform/provinceNominations.js";
import { applyBrandVerificationSideEffects } from "../platform/syncBrandVerification.js";

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "VERIFIED", "APPROVED", "ACTIVE"])
});

const resolveFraudSchema = z.object({
  action: z.enum(["APPROVE_SUBMISSION", "REJECT_SUBMISSION"]),
  resolutionNote: z.string().min(3).optional()
});

const auditQuerySchema = z.object({
  action: z.string().optional(),
  targetType: z.string().optional(),
  actorId: z.string().optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(200).optional()
});

const queueQuerySchema = z.object({
  search: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  sortBy: z.enum(["RISK", "NEWEST"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional()
});

const savePresetSchema = z.object({
  module: z.string().min(2),
  name: z.string().min(2).max(80),
  filters: z.record(z.any())
});

const bulkApprovalSchema = z.object({
  entity: z.enum(["users", "schools", "brands"]),
  ids: z.array(z.string().cuid()).min(1),
  status: z.enum(["PENDING", "VERIFIED", "APPROVED", "ACTIVE"])
});

const bulkFraudResolveSchema = z.object({
  ids: z.array(z.string().cuid()).min(1),
  action: z.enum(["APPROVE_SUBMISSION", "REJECT_SUBMISSION"]),
  resolutionNote: z.string().min(3).optional()
});

type ApprovalStatus = "PENDING" | "VERIFIED" | "APPROVED" | "ACTIVE" | "SUSPENDED";

const allowedTransitions: Record<ApprovalStatus, ApprovalStatus[]> = {
  PENDING: ["VERIFIED"],
  VERIFIED: ["APPROVED"],
  APPROVED: ["ACTIVE"],
  ACTIVE: [],
  SUSPENDED: []
};

function canTransition(current: ApprovalStatus, target: ApprovalStatus): boolean {
  return allowedTransitions[current]?.includes(target) ?? false;
}

export const adminRouter = Router();

adminRouter.use("/commercial", commercialAdminRouter);

adminRouter.use(requireAuth, requireRole(["SUPER_ADMIN", "ADMIN_STAFF"]));

adminRouter.use("/schools", requireRole(["SUPER_ADMIN"]), adminSchoolInfrastructureRouter);
adminRouter.use("/school-verification", requireRole(["SUPER_ADMIN"]), adminSchoolVerificationRouter);

const writeAudit = async (
  actorId: string | undefined,
  action: string,
  targetType: string,
  targetId: string,
  payload?: unknown
): Promise<void> => {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      targetType,
      targetId,
      payload: payload ? (payload as object) : undefined
    }
  });
};

const toPageMeta = (page: number, pageSize: number, total: number) => ({
  page,
  pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / pageSize))
});


adminRouter.patch("/approvals/users/:id/status", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    res.status(403).json({ message: "SUPER_ADMIN role required for approvals." });
    return;
  }
  const payload = updateStatusSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    res.status(404).json({ message: "User not found." });
    return;
  }

  if (!canTransition(user.status, payload.data.status)) {
    res.status(409).json({ message: `Invalid transition from ${user.status} to ${payload.data.status}.` });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { status: payload.data.status }
  });
  await writeAudit(req.user?.id, "APPROVAL_STATUS_CHANGE", "USER", updated.id, {
    from: user.status,
    to: updated.status
  });

  res.json(updated);
});

adminRouter.patch("/approvals/schools/:id/status", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    res.status(403).json({ message: "SUPER_ADMIN role required for approvals." });
    return;
  }
  const payload = updateStatusSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const school = await prisma.school.findUnique({ where: { id: req.params.id } });
  if (!school) {
    res.status(404).json({ message: "School not found." });
    return;
  }

  if (!canTransition(school.status, payload.data.status)) {
    res.status(409).json({ message: `Invalid transition from ${school.status} to ${payload.data.status}.` });
    return;
  }

  if (schoolStatusRequiresVerificationApproval(payload.data.status)) {
    const gate = await assertSchoolVerificationApproved(school.id);
    if (!gate.ok) {
      res.status(409).json({
        message: gate.message,
        verificationStatus: gate.verificationStatus
      });
      return;
    }
  }

  const updated = await prisma.school.update({
    where: { id: school.id },
    data: { status: payload.data.status }
  });
  await writeAudit(req.user?.id, "APPROVAL_STATUS_CHANGE", "SCHOOL", updated.id, {
    from: school.status,
    to: updated.status
  });

  void notifySchoolActivatedIfNeeded(updated.id, school.status);

  res.json(updated);
});

adminRouter.patch("/approvals/schools/:id/suspend", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    res.status(403).json({ message: "SUPER_ADMIN role required for approvals." });
    return;
  }

  const school = await prisma.school.findUnique({ where: { id: req.params.id } });
  if (!school) {
    res.status(404).json({ message: "School not found." });
    return;
  }

  if (school.status === "SUSPENDED") {
    res.status(409).json({ message: "School is already removed." });
    return;
  }

  if (school.status === "ACTIVE") {
    res.status(409).json({ message: "Active schools must be frozen through governance review before removal." });
    return;
  }

  const updated = await prisma.school.update({
    where: { id: school.id },
    data: { status: "SUSPENDED" }
  });

  await writeAudit(req.user?.id, "APPROVAL_STATUS_CHANGE", "SCHOOL", updated.id, {
    from: school.status,
    to: "SUSPENDED",
    action: "REMOVED"
  });

  res.json(updated);
});

adminRouter.patch("/approvals/brands/:id/status", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    res.status(403).json({ message: "SUPER_ADMIN role required for approvals." });
    return;
  }
  const payload = updateStatusSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const brand = await prisma.brand.findUnique({ where: { id: req.params.id } });
  if (!brand) {
    res.status(404).json({ message: "Brand not found." });
    return;
  }

  if (!canTransition(brand.status, payload.data.status)) {
    res.status(409).json({ message: `Invalid transition from ${brand.status} to ${payload.data.status}.` });
    return;
  }


  const updated = await prisma.brand.update({
    where: { id: brand.id },
    data: {
      status: payload.data.status,
      ...(payload.data.status !== "ACTIVE" ? { featuredOnHome: false, publicProfileEnabled: false } : {})
    }
  });

  await applyBrandVerificationSideEffects(
    prisma,
    {
      id: brand.id,
      codePrefix: brand.codePrefix,
      founderExempt: brand.founderExempt,
      verificationStatus: brand.verificationStatus,
      verificationCode: brand.verificationCode
    },
    payload.data.status,
    req.user?.id
  );

  await writeAudit(req.user?.id, "APPROVAL_STATUS_CHANGE", "BRAND", updated.id, {
    from: brand.status,
    to: updated.status
  });

  void notifyBrandActivatedIfNeeded(updated.id, brand.status);

  res.json(updated);
});

adminRouter.use(adminBrandRouter);

adminRouter.post("/approvals/bulk", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    res.status(403).json({ message: "SUPER_ADMIN role required for approvals." });
    return;
  }
  const payload = bulkApprovalSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  let updatedCount = 0;
  if (payload.data.entity === "users") {
    const result = await prisma.user.updateMany({
      where: { id: { in: payload.data.ids } },
      data: { status: payload.data.status }
    });
    updatedCount = result.count;
  } else if (payload.data.entity === "schools") {
    if (schoolStatusRequiresVerificationApproval(payload.data.status)) {
      const schools = await prisma.school.findMany({
        where: { id: { in: payload.data.ids } },
        select: { id: true }
      });
      for (const row of schools) {
        const gate = await assertSchoolVerificationApproved(row.id);
        if (!gate.ok) {
          res.status(409).json({
            message: `Bulk school approval blocked: ${gate.message}`,
            schoolId: row.id,
            verificationStatus: gate.verificationStatus
          });
          return;
        }
      }
    }
    const before = await prisma.school.findMany({
      where: { id: { in: payload.data.ids } },
      select: { id: true, status: true }
    });
    const result = await prisma.school.updateMany({
      where: { id: { in: payload.data.ids } },
      data: { status: payload.data.status }
    });
    updatedCount = result.count;
    void queueSchoolActivationsFromSnapshots(
      before.map((row) => ({ id: row.id, previousStatus: row.status }))
    );
  } else {
    const before = await prisma.brand.findMany({
      where: { id: { in: payload.data.ids } },
      select: { id: true, status: true }
    });
    const result = await prisma.brand.updateMany({
      where: { id: { in: payload.data.ids } },
      data: {
        status: payload.data.status,
        ...(payload.data.status !== "ACTIVE" ? { featuredOnHome: false, publicProfileEnabled: false } : {})
      }
    });
    updatedCount = result.count;
    void queueBrandActivationsFromSnapshots(
      before.map((row) => ({ id: row.id, previousStatus: row.status }))
    );
  }

  await writeAudit(req.user?.id, "APPROVAL_BULK_STATUS_CHANGE", payload.data.entity.toUpperCase(), "BULK", {
    ids: payload.data.ids,
    status: payload.data.status,
    updatedCount
  });
  res.json({ updatedCount });
});

adminRouter.post("/moderation/fraud-flags/bulk-resolve", async (req, res) => {
  const payload = bulkFraudResolveSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }
  const flags = await prisma.fraudFlag.findMany({
    where: { id: { in: payload.data.ids }, status: "OPEN" },
    select: { id: true, submissionId: true }
  });
  const ids = flags.map((x) => x.id);
  const submissionIds = flags.map((x) => x.submissionId);
  const now = new Date();

  await prisma.$transaction([
    prisma.fraudFlag.updateMany({
      where: { id: { in: ids } },
      data: { status: "RESOLVED", resolutionNote: payload.data.resolutionNote, resolvedAt: now }
    }),
    prisma.submission.updateMany({
      where: { id: { in: submissionIds } },
      data: {
        state: payload.data.action === "REJECT_SUBMISSION" ? "REJECTED" : "VALID",
        rejectionReason: payload.data.action === "REJECT_SUBMISSION" ? payload.data.resolutionNote || "Bulk moderation rejected." : null,
        reviewedAt: now
      }
    })
  ]);

  await writeAudit(req.user?.id, "FRAUD_FLAG_BULK_RESOLVED", "FRAUD_FLAG", "BULK", {
    ids,
    action: payload.data.action
  });
  res.json({ resolvedCount: ids.length });
});

adminRouter.get("/presets", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const module = typeof req.query.module === "string" ? req.query.module : undefined;
  const items = await prisma.adminQueuePreset.findMany({
    where: {
      userId: req.user.id,
      ...(module ? { module } : {})
    },
    orderBy: { createdAt: "desc" }
  });
  res.json({ items });
});

adminRouter.post("/presets", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const payload = savePresetSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const item = await prisma.adminQueuePreset.upsert({
    where: {
      userId_module_name: {
        userId: req.user.id,
        module: payload.data.module,
        name: payload.data.name
      }
    },
    create: { userId: req.user.id, module: payload.data.module, name: payload.data.name, filters: payload.data.filters },
    update: { filters: payload.data.filters }
  });
  res.status(201).json(item);
});

adminRouter.delete("/presets/:id", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const item = await prisma.adminQueuePreset.findUnique({ where: { id: req.params.id } });
  if (!item || item.userId !== req.user.id) {
    res.status(404).json({ message: "Preset not found." });
    return;
  }
  await prisma.adminQueuePreset.delete({ where: { id: item.id } });
  res.json({ message: "Preset deleted." });
});

adminRouter.get("/queue", async (req, res) => {
  const query = queueQuerySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ message: "Invalid query parameters." });
    return;
  }

  const search = query.data.search?.trim();
  const page = query.data.page ?? 1;
  const pageSize = query.data.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const [pendingUsersTotal, pendingSchoolsTotal, pendingBrandsTotal, fraudFlagsTotal] = await Promise.all([
    prisma.user.count({
      where: {
        status: { in: ["PENDING", "VERIFIED", "APPROVED"] },
        ...(search
          ? {
              OR: [{ fullName: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }]
            }
          : {})
      }
    }),
    prisma.school.count({
      where: {
        status: { in: ["PENDING"] },
        ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { district: { contains: search, mode: "insensitive" } }] } : {})
      }
    }),
    prisma.brand.count({
      where: {
        status: { in: ["PENDING", "VERIFIED", "APPROVED"] },
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {})
      }
    }),
    prisma.fraudFlag.count({
      where: {
        status: "OPEN",
        ...(query.data.severity ? { severity: query.data.severity } : {}),
        ...(search ? { reason: { contains: search, mode: "insensitive" } } : {})
      }
    })
  ]);

  const [pendingUsers, pendingSchools, pendingBrands, openFraudFlags] = await Promise.all([
    prisma.user.findMany({
      where: {
        status: { in: ["PENDING", "VERIFIED", "APPROVED"] },
        ...(search
          ? {
              OR: [{ fullName: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }]
            }
          : {})
      },
      select: { id: true, fullName: true, email: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      skip,
      take: pageSize
    }),
    prisma.school.findMany({
      where: {
        status: { in: ["PENDING"] },
        ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { district: { contains: search, mode: "insensitive" } }] } : {})
      },
      select: {
        id: true,
        name: true,
        province: true,
        district: true,
        status: true,
        organizationCategory: true,
        createdAt: true,
        verification: { select: { status: true, emisNumber: true, registrationNumber: true, submittedAt: true, centreType: true } }
      },
      orderBy: { createdAt: "asc" },
      skip,
      take: pageSize
    }),
    prisma.brand.findMany({
      where: {
        status: { in: ["PENDING", "VERIFIED", "APPROVED"] },
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {})
      },
      select: { id: true, name: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      skip,
      take: pageSize
    }),
    prisma.fraudFlag.findMany({
      where: {
        status: "OPEN",
        ...(query.data.severity ? { severity: query.data.severity } : {}),
        ...(search ? { reason: { contains: search, mode: "insensitive" } } : {})
      },
      include: {
        submission: {
          select: {
            id: true,
            codeValue: true,
            area: true,
            learner: { select: { fullName: true, learnerCode: true } },
            campaign: { select: { name: true, slug: true } }
          }
        }
      },
      orderBy: query.data.sortBy === "NEWEST" ? [{ createdAt: "desc" }] : [{ riskScore: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize
    })
  ]);

  res.json({
    pendingUsers,
    pendingSchools,
    pendingBrands,
    openFraudFlags,
    pageMeta: {
      pendingUsers: toPageMeta(page, pageSize, pendingUsersTotal),
      pendingSchools: toPageMeta(page, pageSize, pendingSchoolsTotal),
      pendingBrands: toPageMeta(page, pageSize, pendingBrandsTotal),
      openFraudFlags: toPageMeta(page, pageSize, fraudFlagsTotal)
    }
  });
});

adminRouter.get("/verified-schools", async (req, res) => {
  const query = queueQuerySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ message: "Invalid query parameters." });
    return;
  }

  const result = await listVerifiedSchools({
    page: query.data.page,
    pageSize: query.data.pageSize,
    search: query.data.search
  });
  res.json(result);
});

adminRouter.post("/verified-schools/:schoolId/emails/welcome", async (req, res) => {
  if (!req.user?.id) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  const result = await sendVerifiedSchoolWelcomeEmail({
    schoolId: req.params.schoolId,
    actorUserId: req.user.id
  });

  if (!result.ok) {
    res.status(result.status).json({ message: result.message });
    return;
  }

  res.json({ message: result.message, emailed: result.emailed });
});

adminRouter.post("/verified-schools/:schoolId/emails/progress", async (req, res) => {
  if (!req.user?.id) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  const result = await sendVerifiedSchoolProgressEmail({
    schoolId: req.params.schoolId,
    actorUserId: req.user.id,
    body: req.body
  });

  if (!result.ok) {
    res.status(result.status).json(
      "issues" in result ? { message: result.message, issues: result.issues } : { message: result.message }
    );
    return;
  }

  res.json({ message: result.message, emailed: result.emailed });
});

adminRouter.get("/audit-logs", async (req, res) => {
  const query = auditQuerySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ message: "Invalid query parameters." });
    return;
  }

  const page = query.data.page ?? 1;
  const pageSize = query.data.pageSize ?? 50;
  const skip = (page - 1) * pageSize;
  const where = buildAuditWhere(query.data);

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where: where as never }),
    prisma.auditLog.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize
    })
  ]);

  res.json({ items: logs, pageMeta: toPageMeta(page, pageSize, total) });
});

adminRouter.post("/audit-logs/export-jobs", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const payload = auditQuerySchema.safeParse(req.body ?? {});
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }
  const jobId = await enqueueAuditExportJob(req.user.id, payload.data);
  const job = await prisma.auditExportJob.findUnique({ where: { id: jobId } });
  res.status(201).json(job);
});

adminRouter.get("/audit-logs/export-jobs", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const items = await prisma.auditExportJob.findMany({
    where: { requestedById: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  res.json({ items });
});

adminRouter.get("/audit-logs/export-jobs/:id", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const item = await prisma.auditExportJob.findUnique({ where: { id: req.params.id } });
  if (!item || item.requestedById !== req.user.id) {
    res.status(404).json({ message: "Job not found." });
    return;
  }
  res.json(item);
});

adminRouter.get("/audit-logs/export-jobs/:id/download", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const item = await prisma.auditExportJob.findUnique({ where: { id: req.params.id } });
  if (!item || item.requestedById !== req.user.id) {
    res.status(404).json({ message: "Job not found." });
    return;
  }
  if (item.status !== "COMPLETED" || !item.csvContent) {
    res.status(409).json({ message: "Export job not ready." });
    return;
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="audit-export-${item.id}.csv"`);
  res.status(200).send(item.csvContent);
});

adminRouter.get("/audit-logs/export", async (req, res) => {
  const query = auditQuerySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ message: "Invalid query parameters." });
    return;
  }
  const logs = await prisma.auditLog.findMany({
    where: buildAuditWhere(query.data) as never,
    orderBy: { createdAt: "desc" },
    take: 2000
  });

  const header = ["id", "createdAt", "action", "targetType", "targetId", "actorId"];
  const rows = logs.map((item) =>
    [item.id, item.createdAt.toISOString(), item.action, item.targetType, item.targetId, item.actorId ?? ""]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [header.join(","), ...rows].join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=\"audit-logs.csv\"");
  res.status(200).send(csv);
});

adminRouter.get("/moderation/fraud-flags", async (_req, res) => {
  const flags = await prisma.fraudFlag.findMany({
    where: { status: "OPEN" },
    include: {
      submission: {
        select: {
          id: true,
          codeValue: true,
          area: true,
          learner: { select: { fullName: true, learnerCode: true } },
          campaign: { select: { name: true, slug: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  res.json({ items: flags });
});

adminRouter.patch("/moderation/fraud-flags/:id/resolve", async (req, res) => {
  const payload = resolveFraudSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const flag = await prisma.fraudFlag.findUnique({
    where: { id: req.params.id },
    include: { submission: true }
  });
  if (!flag) {
    res.status(404).json({ message: "Fraud flag not found." });
    return;
  }
  if (flag.status !== "OPEN") {
    res.status(409).json({ message: "Fraud flag already resolved." });
    return;
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.fraudFlag.update({
      where: { id: flag.id },
      data: {
        status: "RESOLVED",
        resolutionNote: payload.data.resolutionNote,
        resolvedAt: now
      }
    }),
    prisma.submission.update({
      where: { id: flag.submissionId },
      data: {
        state: payload.data.action === "REJECT_SUBMISSION" ? "REJECTED" : "VALID",
        rejectionReason:
          payload.data.action === "REJECT_SUBMISSION" ? payload.data.resolutionNote || "Moderation rejected." : null,
        reviewedAt: now
      }
    })
  ]);
  await writeAudit(req.user?.id, "FRAUD_FLAG_RESOLVED", "FRAUD_FLAG", flag.id, {
    action: payload.data.action,
    resolutionNote: payload.data.resolutionNote,
    submissionId: flag.submissionId
  });

  res.json({ message: "Fraud flag resolved." });
});

const notificationLogsQuerySchema = z.object({
  template: z.string().optional(),
  status: z.enum(["QUEUED", "PROCESSING", "SENT", "FAILED"]).optional(),
  recipient: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional()
});

adminRouter.get("/notifications/logs", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    res.status(403).json({ message: "SUPER_ADMIN role required." });
    return;
  }

  const query = notificationLogsQuerySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ message: "Validation failed.", issues: query.error.flatten() });
    return;
  }

  const page = query.data.page ?? 1;
  const pageSize = query.data.pageSize ?? 25;
  const where = {
    ...(query.data.template ? { template: query.data.template as never } : {}),
    ...(query.data.status ? { status: query.data.status } : {}),
    ...(query.data.recipient ? { recipient: { contains: query.data.recipient, mode: "insensitive" as const } } : {}),
    ...(query.data.entityType ? { entityType: query.data.entityType } : {}),
    ...(query.data.entityId ? { entityId: query.data.entityId } : {})
  };

  const [total, logs] = await prisma.$transaction([
    prisma.notificationLog.count({ where }),
    prisma.notificationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        job: {
          select: {
            id: true,
            status: true,
            attempts: true,
            maxAttempts: true,
            scheduledAt: true,
            processedAt: true,
            lastError: true
          }
        }
      }
    })
  ]);

  res.json({ total, page, pageSize, logs });
});

adminRouter.post("/notifications/jobs/:id/retry", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    res.status(403).json({ message: "SUPER_ADMIN role required." });
    return;
  }

  const job = await prisma.notificationJob.findUnique({ where: { id: req.params.id } });
  if (!job) {
    res.status(404).json({ message: "Notification job not found." });
    return;
  }

  if (job.status === "SENT") {
    res.status(409).json({ message: "Notification already sent." });
    return;
  }

  await prisma.$transaction([
    prisma.notificationJob.update({
      where: { id: job.id },
      data: {
        status: "QUEUED",
        scheduledAt: new Date(),
        lockedAt: null,
        lastError: null
      }
    }),
    prisma.notificationLog.update({
      where: { id: job.logId },
      data: { status: "QUEUED", errorMessage: null }
    })
  ]);

  res.json({ message: "Notification queued for retry." });
});

adminRouter.get("/platform-snapshot", async (_req, res) => {
  const snapshot = await getAdminPlatformSnapshot();
  res.json(snapshot);
});

adminRouter.get("/analytics/executive", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    res.status(403).json({ message: "SUPER_ADMIN role required." });
    return;
  }

  const analytics = await getPlatformExecutiveAnalytics();
  res.json(analytics);
});

const adminReportModules = new Set<AdminReportModule>(["overview", "analytics", "commercial", "brands", "verified"]);

adminRouter.get("/reports/:module/pdf", async (req, res) => {
  const module = req.params.module as AdminReportModule;
  if (!adminReportModules.has(module)) {
    res.status(404).json({ message: "Report not found." });
    return;
  }

  if (module !== "overview" && req.user?.role !== "SUPER_ADMIN") {
    res.status(403).json({ message: "SUPER_ADMIN role required for this report." });
    return;
  }

  try {
    const pdf = await buildAdminReportPdf(module);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", adminReportContentDisposition(module));
    res.send(pdf);
  } catch (err) {
    console.error("[admin] PDF report failed:", module, err);
    res.status(500).json({ message: "Could not generate PDF report." });
  }
});

adminRouter.get("/province-nominations", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.role !== "ADMIN_STAFF") {
    res.status(403).json({ message: "Admin role required." });
    return;
  }

  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 25);
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const provinceCode = typeof req.query.provinceCode === "string" ? req.query.provinceCode : undefined;

  const result = await listProvinceNominations({ page, pageSize, status, provinceCode });
  res.json(result);
});

adminRouter.patch("/province-nominations/:id/status", async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.role !== "ADMIN_STAFF") {
    res.status(403).json({ message: "Admin role required." });
    return;
  }

  const status = typeof req.body?.status === "string" ? req.body.status : "";
  if (!["NEW", "REVIEWED", "CONTACTED", "CLOSED"].includes(status)) {
    res.status(400).json({ message: "Invalid status." });
    return;
  }

  const row = await prisma.provinceNomination.update({
    where: { id: req.params.id },
    data: { status }
  });

  res.json(row);
});
