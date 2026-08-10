import { prisma } from "../../lib/prisma.js";
import { logParticipationAudit } from "../participation/services/auditTrail.js";
import { batchCsvFilename, codesToCsv, deriveCodeBatchStatus } from "./batchInventory.js";

export type DownloadCodeBatchInput = {
  batchId: string;
  brandId: string;
  userId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type DownloadCodeBatchResult = {
  filename: string;
  csv: string;
  codeCount: number;
  batchCode: string;
  downloadId: string;
};

export async function downloadCodeBatchCsv(
  input: DownloadCodeBatchInput
): Promise<DownloadCodeBatchResult | { error: string; status: number }> {
  const batch = await prisma.codeBatch.findUnique({
    where: { id: input.batchId },
    include: {
      campaign: { include: { brand: { select: { id: true, name: true } } } },
      codes: { select: { value: true, status: true }, orderBy: { value: "asc" } }
    }
  });

  if (!batch) return { error: "Batch not found.", status: 404 };
  if (batch.campaign.brandId !== input.brandId) {
    return { error: "Cannot download another brand's codes.", status: 403 };
  }

  const codes = batch.codes.map((c) => c.value);
  const used = batch.codes.filter((c) => c.status === "USED").length;
  const expired = batch.codes.filter((c) => c.status === "EXPIRED" || c.status === "INVALIDATED").length;
  const nextDownloadCount = batch.downloadCount + 1;
  const status = deriveCodeBatchStatus({
    totalCodes: batch.codes.length,
    usedCodes: used,
    expiredCodes: expired,
    downloadCount: nextDownloadCount,
    expiresAt: batch.expiresAt
  });

  const download = await prisma.codeBatchDownload.create({
    data: {
      batchId: batch.id,
      downloadedByUserId: input.userId,
      ipAddress: input.ipAddress ?? undefined,
      userAgent: input.userAgent ?? undefined,
      codeCount: codes.length
    }
  });

  await prisma.codeBatch.update({
    where: { id: batch.id },
    data: {
      downloadCount: nextDownloadCount,
      downloadedAt: new Date(),
      status
    }
  });

  await logParticipationAudit({
    action: "CODE_BATCH_DOWNLOADED",
    targetType: "CodeBatch",
    targetId: batch.id,
    actorId: input.userId,
    payload: {
      downloadId: download.id,
      campaignId: batch.campaignId,
      brandId: batch.campaign.brandId,
      batchCode: batch.batchCode,
      codeCount: codes.length,
      ipAddress: input.ipAddress ?? null
    }
  });

  const filename = batchCsvFilename({
    brandName: batch.campaign.brand.name,
    campaignName: batch.campaign.name,
    batchCode: batch.batchCode
  });

  return {
    filename,
    csv: codesToCsv(codes),
    codeCount: codes.length,
    batchCode: batch.batchCode,
    downloadId: download.id
  };
}
