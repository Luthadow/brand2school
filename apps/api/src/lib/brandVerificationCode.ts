import { randomBytes } from "crypto";
import type { Prisma } from "../generated/prisma/index.js";

type BrandDb = Prisma.TransactionClient | Prisma.DefaultPrismaClient;

const VERIFY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSegment(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += VERIFY_ALPHABET[bytes[i] % VERIFY_ALPHABET.length];
  }
  return out;
}

/** Format: R2K-26-84XQ19 (brand prefix · 2-digit year · 6-char ID) */
export function formatBrandVerificationCode(codePrefix: string, year = new Date().getFullYear()): string {
  const prefix = codePrefix.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 4) || "BRND";
  const yy = String(year).slice(-2);
  return `${prefix}-${yy}-${randomSegment(6)}`;
}

export async function generateUniqueBrandVerificationCode(
  prisma: BrandDb,
  codePrefix: string
): Promise<string> {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const verificationCode = formatBrandVerificationCode(codePrefix);
    const taken = await prisma.brand.findUnique({
      where: { verificationCode },
      select: { id: true }
    });
    if (!taken) return verificationCode;
  }
  throw new Error("Could not allocate a unique brand verification code.");
}

export async function ensureBrandVerificationCode(
  prisma: BrandDb,
  brandId: string,
  codePrefix: string
): Promise<string> {
  const existing = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { verificationCode: true }
  });
  if (existing?.verificationCode) return existing.verificationCode;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const verificationCode = formatBrandVerificationCode(codePrefix);
    const taken = await prisma.brand.findUnique({
      where: { verificationCode },
      select: { id: true }
    });
    if (taken && taken.id !== brandId) continue;
    await prisma.brand.update({
      where: { id: brandId },
      data: { verificationCode }
    });
    return verificationCode;
  }

  throw new Error("Could not allocate a unique brand verification code.");
}
