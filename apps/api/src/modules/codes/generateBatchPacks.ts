import { prisma } from "../../lib/prisma.js";
import { generateSecureCodeBatch } from "./generateBatch.js";
import { CODE_DOWNLOAD_BATCH_SIZE } from "./batchInventory.js";

export type GenerateBatchPacksInput = {
  campaignId: string;
  quantity: number;
  batchNamePrefix?: string;
  productId?: string;
  codeVersion?: string;
  expiresAt?: Date;
  createdByUserId?: string;
};

export type GenerateBatchPacksResult = {
  requested: number;
  generatedCount: number;
  batchCount: number;
  packSize: number;
  batches: Array<{
    batchId: string;
    batchCode: string;
    batchName: string;
    generatedCount: number;
    sampleCodes: string[];
  }>;
};

/**
 * Generate secure codes and auto-split into download packs of 50.
 * Quantity can be any size; packs are created automatically.
 */
export async function generateSecureCodeBatchPacks(
  input: GenerateBatchPacksInput
): Promise<GenerateBatchPacksResult> {
  const quantity = Math.min(Math.max(Math.floor(input.quantity), 1), 50000);
  const packSize = CODE_DOWNLOAD_BATCH_SIZE;
  const prefix = (input.batchNamePrefix ?? "Campaign codes").trim() || "Campaign codes";

  await prisma.campaign.update({
    where: { id: input.campaignId },
    data: { codeMode: "GENERATE" }
  });

  const batches: GenerateBatchPacksResult["batches"] = [];
  let remaining = quantity;
  let packIndex = 0;

  while (remaining > 0) {
    packIndex += 1;
    const count = Math.min(packSize, remaining);
    const batchName = `${prefix} — Batch ${String(packIndex).padStart(3, "0")}`;
    const result = await generateSecureCodeBatch({
      campaignId: input.campaignId,
      batchName,
      count,
      productId: input.productId,
      codeVersion: input.codeVersion,
      expiresAt: input.expiresAt
    });

    await prisma.codeBatch.update({
      where: { id: result.batchId },
      data: {
        status: "AVAILABLE",
        source: "GENERATE",
        ...(input.createdByUserId ? { createdByUserId: input.createdByUserId } : {})
      }
    });

    batches.push({
      batchId: result.batchId,
      batchCode: result.batchCode,
      batchName,
      generatedCount: result.generatedCount,
      sampleCodes: result.sampleCodes
    });
    remaining -= count;
  }

  return {
    requested: quantity,
    generatedCount: batches.reduce((sum, b) => sum + b.generatedCount, 0),
    batchCount: batches.length,
    packSize,
    batches
  };
}
