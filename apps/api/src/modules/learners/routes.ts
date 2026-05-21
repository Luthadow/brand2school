import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";

const createLearnerSchema = z.object({
  schoolId: z.string().cuid(),
  fullName: z.string().min(2),
  grade: z.string().min(1),
  guardianPhone: z.string().min(8).optional()
});

import { generateLearnerCode } from "../../lib/codes.js";

export const learnersRouter = Router();

learnersRouter.use(requireAuth, requireRole(["SUPER_ADMIN", "ADMIN_STAFF"]));

learnersRouter.post(
  "/",
  async (req, res) => {
    const payload = createLearnerSchema.safeParse(req.body);
    if (!payload.success) {
      res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
      return;
    }

    const school = await prisma.school.findUnique({ where: { id: payload.data.schoolId } });
    if (!school) {
      res.status(404).json({ message: "School not found." });
      return;
    }

    let learnerCode = generateLearnerCode(payload.data.fullName, payload.data.grade);
    for (let i = 0; i < 5; i += 1) {
      // Retry code generation on uniqueness conflict.
      const exists = await prisma.learner.findUnique({ where: { learnerCode } });
      if (!exists) break;
      learnerCode = generateLearnerCode(payload.data.fullName, payload.data.grade);
    }

    const learner = await prisma.learner.create({
      data: {
        ...payload.data,
        learnerCode
      }
    });

    res.status(201).json(learner);
  }
);

learnersRouter.get("/:id/dashboard", async (req, res) => {
  const learner = await prisma.learner.findUnique({
    where: { id: req.params.id },
    include: {
      school: true
    }
  });
  if (!learner) {
    res.status(404).json({ message: "Learner not found." });
    return;
  }

  const [validSubmissions, recentSubmissions] = await Promise.all([
    prisma.submission.count({
      where: { learnerId: learner.id, state: "VALID" }
    }),
    prisma.submission.findMany({
      where: { learnerId: learner.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, codeValue: true, area: true, state: true, createdAt: true }
    })
  ]);

  res.json({
    learner: {
      id: learner.id,
      fullName: learner.fullName,
      learnerCode: learner.learnerCode,
      grade: learner.grade,
      school: {
        id: learner.school.id,
        name: learner.school.name
      }
    },
    metrics: {
      validSubmissions
    },
    recentSubmissions
  });
});
