import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { reviewSchoolVerificationPacket } from "../schools/schoolVerification/reviewSchoolVerification.js";
import { serializeSchoolVerification } from "../schools/schoolVerification/serializeSchoolVerification.js";

export const adminSchoolVerificationRouter = Router();

adminSchoolVerificationRouter.get("/queue", async (_req, res) => {
  const rows = await prisma.schoolVerification.findMany({
    where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    orderBy: { submittedAt: "asc" },
    take: 50,
    include: {
      school: {
        select: {
          id: true,
          name: true,
          province: true,
          district: true,
          status: true,
          principalName: true
        }
      }
    }
  });

  res.json({
    items: rows.map((row) => ({
      ...serializeSchoolVerification(row),
      school: {
        id: row.school.id,
        name: row.school.name,
        province: row.school.province,
        district: row.school.district,
        entityStatus: row.school.status,
        principalName: row.school.principalName
      }
    }))
  });
});

adminSchoolVerificationRouter.get("/:schoolId", async (req, res) => {
  const school = await prisma.school.findUnique({
    where: { id: req.params.schoolId },
    include: { verification: true }
  });
  if (!school) {
    res.status(404).json({ message: "School not found." });
    return;
  }

  res.json({
    school: {
      id: school.id,
      name: school.name,
      province: school.province,
      district: school.district,
      status: school.status,
      principalName: school.principalName,
      contactEmail: school.contactEmail,
      schoolCode: school.schoolCode
    },
    verification: school.verification ? serializeSchoolVerification(school.verification) : null
  });
});

adminSchoolVerificationRouter.patch("/:schoolId", async (req, res) => {
  if (!req.user?.id) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  const result = await reviewSchoolVerificationPacket({
    schoolId: req.params.schoolId,
    reviewerUserId: req.user.id,
    body: req.body
  });

  if (!result.ok) {
    res.status(result.status).json(
      "issues" in result ? { message: result.message, issues: result.issues } : { message: result.message }
    );
    return;
  }

  res.json(result);
});
