import { prisma } from "../../lib/prisma.js";
import {
  deriveBatchCode,
  formatStructuredCode,
  generateSecureToken,
  computeCodeChecksum
} from "../../lib/participationCodes.js";
import { logParticipationAudit } from "../participation/services/auditTrail.js";

export type GenerateBatchInput = {
  campaignId: string;
  batchName: string;
  count: number;
  productId?: string;
  batchCode?: string;
  codeVersion?: string;
  expiresAt?: Date;
};

export async function generateSecureCodeBatch(input: GenerateBatchInput) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: input.campaignId },
    include: { brand: true }
  });
  if (!campaign) throw new Error("Campaign not found.");
  if (!campaign.brand.codePrefix) throw new Error("Brand code prefix is not configured.");

  const count = Math.min(Math.max(input.count, 1), 50000);
  const codeVersion = (input.codeVersion ?? "V1").toUpperCase();
  const existingBatches = await prisma.codeBatch.count({ where: { campaignId: campaign.id } });
  const batchCode = (input.batchCode ?? deriveBatchCode(existingBatches + 1)).toUpperCase();

  const batch = await prisma.codeBatch.create({
    data: {
      campaignId: campaign.id,
      batchName: input.batchName,
      batchCode,
      codeVersion,
      expiresAt: input.expiresAt
    }
  });

  const values = new Set<string>();
  const rows: Array<{
    batchId: string;
    brandId: string;
    campaignId: string;
    productId?: string;
    value: string;
    token: string;
    checksum: string;
    codeVersion: string;
    status: "UNUSED";
  }> = [];

  while (values.size < count) {
    const token = generateSecureToken(6);
    const value = formatStructuredCode(
      campaign.brand.codePrefix,
      campaign.campaignCode,
      batchCode,
      token
    );
    if (values.has(value)) continue;
    values.add(value);
    const checksum = computeCodeChecksum(
      campaign.brand.codePrefix,
      campaign.campaignCode,
      batchCode,
      token
    );
    rows.push({
      batchId: batch.id,
      brandId: campaign.brandId,
      campaignId: campaign.id,
      productId: input.productId,
      value,
      token,
      checksum,
      codeVersion,
      status: "UNUSED"
    });
  }

  await prisma.code.createMany({ data: rows });

  await logParticipationAudit({
    action: "CODE_BATCH_GENERATED",
    targetType: "CodeBatch",
    targetId: batch.id,
    payload: {
      campaignId: campaign.id,
      brandId: campaign.brandId,
      brandPrefix: campaign.brand.codePrefix,
      campaignCode: campaign.campaignCode,
      batchCode,
      codeVersion,
      batchName: input.batchName,
      count: rows.length,
      productId: input.productId ?? null,
      sampleCode: rows[0]?.value
    }
  });

  return {
    batchId: batch.id,
    batchCode,
    codeVersion,
    brandPrefix: campaign.brand.codePrefix,
    campaignCode: campaign.campaignCode,
    generatedCount: rows.length,
    sampleCodes: rows.slice(0, 3).map((r) => r.value)
  };
}

export { buildParticipationCode } from "../../lib/participationCodes.js";
