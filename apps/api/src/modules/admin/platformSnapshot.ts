import { prisma } from "../../lib/prisma.js";
import { registeredSchoolWhere } from "../../lib/schoolMetrics.js";

export type VerificationSubmissionAlert = {
  schoolId: string;
  schoolName: string;
  province: string;
  district: string;
  principalName: string;
  organizationCategory: string;
  verificationStatus: string;
  submittedAt: string;
};

export type AdminPlatformSnapshot = {
  generatedAt: string;
  schoolsRegistered: number;
  schoolsPendingApproval: number;
  schoolsInApprovalPipeline: number;
  schoolsActive: number;
  pendingBrands: number;
  openFraudFlags: number;
  pendingUsers: number;
  totalSubmissions: number;
  verifiedSubmissions: number;
  verificationPacketsPendingReview: number;
  recentVerificationSubmissions: VerificationSubmissionAlert[];
  schoolRegistrationTrend: Array<{ period: string; count: number }>;
};

const approvalPipelineStatuses = ["PENDING", "VERIFIED", "APPROVED"] as const;

function weekKey(date: Date): string {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start.toISOString().slice(0, 10);
}

function buildSchoolRegistrationTrend(
  schools: Array<{ createdAt: Date }>
): Array<{ period: string; count: number }> {
  const map = new Map<string, number>();
  for (const school of schools) {
    const key = weekKey(school.createdAt);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const rows = [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  if (rows.length === 0) {
    return [{ period: "—", count: 0 }];
  }
  return rows.map(([period, count]) => ({ period, count }));
}

/** Single source of truth for admin dashboard KPIs and queue pills. */
export async function getAdminPlatformSnapshot(): Promise<AdminPlatformSnapshot> {
  const [
    schoolsRegistered,
    schoolsPendingApproval,
    schoolsInApprovalPipeline,
    schoolsActive,
    pendingBrands,
    openFraudFlags,
    pendingUsers,
    totalSubmissions,
    verifiedSubmissions,
    verificationPacketsPendingReview,
    recentVerificationRows,
    registeredSchools
  ] = await Promise.all([
    prisma.school.count({ where: registeredSchoolWhere }),
    prisma.school.count({ where: { status: "PENDING" } }),
    prisma.school.count({ where: { status: { in: [...approvalPipelineStatuses] } } }),
    prisma.school.count({ where: { status: "ACTIVE" } }),
    prisma.brand.count({ where: { status: { in: ["PENDING", "VERIFIED", "APPROVED"] } } }),
    prisma.fraudFlag.count({ where: { status: "OPEN" } }),
    prisma.user.count({ where: { status: { in: ["PENDING", "VERIFIED", "APPROVED"] } } }),
    prisma.submission.count(),
    prisma.submission.count({ where: { state: "VALID" } }),
    prisma.schoolVerification.count({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } }
    }),
    prisma.schoolVerification.findMany({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] }, submittedAt: { not: null } },
      orderBy: { submittedAt: "desc" },
      take: 12,
      include: {
        school: {
          select: {
            id: true,
            name: true,
            province: true,
            district: true,
            principalName: true,
            organizationCategory: true
          }
        }
      }
    }),
    prisma.school.findMany({
      where: registeredSchoolWhere,
      select: { createdAt: true },
      orderBy: { createdAt: "asc" }
    })
  ]);

  return {
    generatedAt: new Date().toISOString(),
    schoolsRegistered,
    schoolsPendingApproval,
    schoolsInApprovalPipeline,
    schoolsActive,
    pendingBrands,
    openFraudFlags,
    pendingUsers,
    totalSubmissions,
    verifiedSubmissions,
    verificationPacketsPendingReview,
    recentVerificationSubmissions: recentVerificationRows.map((row) => ({
      schoolId: row.school.id,
      schoolName: row.school.name,
      province: row.school.province,
      district: row.school.district,
      principalName: row.school.principalName,
      organizationCategory: row.school.organizationCategory,
      verificationStatus: row.status,
      submittedAt: row.submittedAt!.toISOString()
    })),
    schoolRegistrationTrend: buildSchoolRegistrationTrend(registeredSchools)
  };
}
