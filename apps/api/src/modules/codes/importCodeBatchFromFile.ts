import { prisma } from "../../lib/prisma.js";
import { computeChecksum } from "../../lib/participationCodes.js";
import { deriveBatchCode, parseStructuredCode } from "../../lib/codeIdentity.js";
import { filterCodesForBrand } from "../commercial/codeOwnership.js";
import { syncCampaignCommercialStatus } from "../commercial/campaignActivation.js";
import { parseProductCodesFromUpload } from "./parseProductCodesFromUpload.js";

export type CodeBatchValidationResult = {
  brandPrefix: string;
  source: "spreadsheet" | "document" | "text";
  rowCount: number;
  codesFound: number;
  uniqueCount: number;
  duplicateInFileCount: number;
  validCount: number;
  invalidCount: number;
  alreadyInDatabaseCount: number;
  readyToImportCount: number;
  invalidSample: string[];
  validSample: string[];
  duplicateInFileSample: string[];
};

export type ImportCodeBatchResult = CodeBatchValidationResult & {
  batchId: string;
  batchCode: string;
  importedCount: number;
  skippedExistingCount: number;
};

async function buildValidation(
  campaignId: string,
  rawCodes: string[],
  source: CodeBatchValidationResult["source"],
  rowCount: number
): Promise<{ campaign: { id: string; brandId: string }; validation: CodeBatchValidationResult }> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { brand: true }
  });
  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const normalizedCodes = rawCodes.map((c) => c.trim().toUpperCase()).filter((c) => c.length > 0);
  const uniqueCodes = [...new Set(normalizedCodes)];
  const duplicateInFile = normalizedCodes.length - uniqueCodes.length;

  const { valid, invalid } = filterCodesForBrand(uniqueCodes, campaign.brand.codePrefix);

  const existing =
    valid.length > 0
      ? await prisma.code.findMany({
          where: { value: { in: valid } },
          select: { value: true }
        })
      : [];
  const existingSet = new Set(existing.map((item) => item.value));
  const readyToImport = valid.filter((value) => !existingSet.has(value));

  const duplicateSamples = normalizedCodes.filter(
    (code, index) => normalizedCodes.indexOf(code) !== index
  );

  const validation: CodeBatchValidationResult = {
    brandPrefix: campaign.brand.codePrefix,
    source,
    rowCount,
    codesFound: normalizedCodes.length,
    uniqueCount: uniqueCodes.length,
    duplicateInFileCount: duplicateInFile,
    validCount: valid.length,
    invalidCount: invalid.length,
    alreadyInDatabaseCount: valid.length - readyToImport.length,
    readyToImportCount: readyToImport.length,
    invalidSample: invalid.slice(0, 25),
    validSample: valid.slice(0, 10),
    duplicateInFileSample: [...new Set(duplicateSamples)].slice(0, 10)
  };

  return { campaign, validation };
}

export async function validateCodeBatchUpload(
  campaignId: string,
  buffer: Buffer,
  filename: string
): Promise<CodeBatchValidationResult> {
  const parsed = await parseProductCodesFromUpload(buffer, filename);
  if (parsed.codes.length === 0) {
    throw new Error(
      "No product codes found. Use a spreadsheet with a “code” column, or list codes one per line in Excel, CSV, or Word."
    );
  }

  const { validation } = await buildValidation(campaignId, parsed.codes, parsed.source, parsed.rowCount);
  return validation;
}

export async function importCodeBatchFromFile(input: {
  campaignId: string;
  buffer: Buffer;
  filename: string;
  batchName: string;
  expiresAt?: Date;
}): Promise<ImportCodeBatchResult> {
  const parsed = await parseProductCodesFromUpload(input.buffer, input.filename);
  if (parsed.codes.length === 0) {
    throw new Error(
      "No product codes found. Use a spreadsheet with a “code” column, or list codes one per line in Excel, CSV, or Word."
    );
  }

  const { campaign, validation } = await buildValidation(
    input.campaignId,
    parsed.codes,
    parsed.source,
    parsed.rowCount
  );

  if (validation.invalidCount > 0) {
    const err = new Error(
      `Some codes do not match brand prefix ${validation.brandPrefix}. Fix the file and try again.`
    ) as Error & { validation?: CodeBatchValidationResult };
    err.validation = validation;
    throw err;
  }

  const uniqueValid = [...new Set(parsed.codes.map((c) => c.trim().toUpperCase()))];
  const { valid } = filterCodesForBrand(uniqueValid, validation.brandPrefix);

  const existing = await prisma.code.findMany({
    where: { value: { in: valid } },
    select: { value: true }
  });
  const existingSet = new Set(existing.map((item) => item.value));
  const toInsert = valid.filter((value) => !existingSet.has(value));

  const existingBatches = await prisma.codeBatch.count({ where: { campaignId: campaign.id } });
  const batchCode = deriveBatchCode(existingBatches + 1).toUpperCase();

  const batch = await prisma.codeBatch.create({
    data: {
      campaignId: campaign.id,
      batchName: input.batchName,
      batchCode,
      codeVersion: "V1",
      expiresAt: input.expiresAt
    }
  });

  if (toInsert.length > 0) {
    await prisma.code.createMany({
      data: toInsert.map((value) => {
        const structured = parseStructuredCode(value);
        return {
          batchId: batch.id,
          brandId: campaign.brandId,
          campaignId: campaign.id,
          value,
          token: structured?.token ?? null,
          checksum: structured?.checksum ?? computeChecksum(value),
          codeVersion: "V1",
          status: "UNUSED" as const
        };
      })
    });
  }

  await syncCampaignCommercialStatus(campaign.id);

  return {
    ...validation,
    batchId: batch.id,
    batchCode,
    importedCount: toInsert.length,
    skippedExistingCount: valid.length - toInsert.length
  };
}
