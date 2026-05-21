import { randomUUID } from "crypto";
import { prisma } from "../../lib/prisma.js";

export type AuditFilterInput = {
  action?: string;
  targetType?: string;
  actorId?: string;
  search?: string;
  from?: string;
  to?: string;
};

export const buildAuditWhere = (query: AuditFilterInput): Record<string, unknown> => {
  const from = query.from ? new Date(query.from) : undefined;
  const to = query.to ? new Date(query.to) : undefined;
  return {
    action: query.action,
    targetType: query.targetType,
    actorId: query.actorId,
    ...(query.search
      ? {
          OR: [
            { action: { contains: query.search, mode: "insensitive" as const } },
            { targetType: { contains: query.search, mode: "insensitive" as const } },
            { targetId: { contains: query.search, mode: "insensitive" as const } }
          ]
        }
      : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {})
  };
};

const toCsv = (rows: Array<Record<string, unknown>>, headers: string[]): string => {
  const header = headers.join(",");
  const data = rows.map((row) =>
    headers
      .map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header, ...data].join("\n");
};

export async function enqueueAuditExportJob(requestedById: string, filters: AuditFilterInput): Promise<string> {
  const job = await prisma.auditExportJob.create({
    data: {
      requestedById,
      status: "QUEUED",
      filters,
      retryCount: 0,
      maxRetries: 5,
      nextRetryAt: new Date()
    }
  });
  return job.id;
}

export async function claimNextAuditExportJob(workerName: string): Promise<string | null> {
  const now = new Date();
  const staleLockCutoff = new Date(Date.now() - 15 * 60 * 1000);
  const candidate = await prisma.auditExportJob.findFirst({
    where: {
      AND: [
        { OR: [{ status: "QUEUED" }, { status: "FAILED" }] },
        { retryCount: { lt: 6 } },
        { OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }] },
        { OR: [{ lockToken: null }, { lockedAt: { lt: staleLockCutoff } }] }
      ]
    },
    orderBy: { createdAt: "asc" }
  });
  if (!candidate) return null;

  const token = `${workerName}-${randomUUID()}`;
  const updated = await prisma.auditExportJob.updateMany({
    where: {
      AND: [
        { id: candidate.id },
        { OR: [{ status: "QUEUED" }, { status: "FAILED" }] },
        { OR: [{ lockToken: null }, { lockedAt: { lt: staleLockCutoff } }] }
      ]
    },
    data: {
      status: "PROCESSING",
      startedAt: new Date(),
      lockToken: token,
      lockedAt: new Date()
    }
  });
  return updated.count === 1 ? candidate.id : null;
}

export async function processAuditExportJob(jobId: string): Promise<void> {
  const job = await prisma.auditExportJob.findUnique({ where: { id: jobId } });
  if (!job) return;
  if (job.status !== "PROCESSING") return;

  try {
    const filters = (job.filters as AuditFilterInput | null) ?? {};
    const where = buildAuditWhere(filters);
    const logs = await prisma.auditLog.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      take: 100000
    });
    const csv = toCsv(
      logs.map((item) => ({
        id: item.id,
        createdAt: item.createdAt.toISOString(),
        action: item.action,
        targetType: item.targetType,
        targetId: item.targetId,
        actorId: item.actorId ?? ""
      })),
      ["id", "createdAt", "action", "targetType", "targetId", "actorId"]
    );
    await prisma.auditExportJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        rowCount: logs.length,
        csvContent: csv,
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        lockToken: null,
        lockedAt: null
      }
    });
  } catch (error) {
    const retryCount = job.retryCount + 1;
    const shouldRetry = retryCount <= job.maxRetries;
    const backoffMinutes = Math.min(30, retryCount * 2);
    await prisma.auditExportJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Export job failed.",
        retryCount,
        nextRetryAt: shouldRetry ? new Date(Date.now() + backoffMinutes * 60 * 1000) : null,
        completedAt: shouldRetry ? null : new Date(),
        lockToken: null,
        lockedAt: null
      }
    });
  }
}

