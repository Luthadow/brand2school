import fs from "node:fs/promises";
import { prisma } from "./prisma.js";
import { brandLogoAbsolutePath, removeBrandLogoFile, saveBrandLogo, type LogoUploadInput } from "./brandStorage.js";

export type { LogoUploadInput };

export async function persistBrandLogo(
  brandId: string,
  file: LogoUploadInput
): Promise<{ storedPath: string }> {
  const storedPath = await saveBrandLogo(brandId, file);
  await prisma.brand.update({
    where: { id: brandId },
    data: { logoUrl: storedPath, logoPng: file.buffer }
  });
  return { storedPath };
}

export async function clearBrandLogo(brandId: string, logoUrl: string | null): Promise<void> {
  await removeBrandLogoFile(brandId, logoUrl);
  await prisma.brand.update({
    where: { id: brandId },
    data: { logoUrl: null, logoPng: null, featuredOnHome: false }
  });
}

/** Read logo bytes from DB, or backfill from disk into DB when missing. */
export async function readBrandLogoBuffer(brandId: string): Promise<Buffer | null> {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { logoPng: true, logoUrl: true }
  });
  if (!brand?.logoUrl) return null;

  if (brand.logoPng && brand.logoPng.length > 0) {
    return Buffer.from(brand.logoPng);
  }

  try {
    const fromDisk = await fs.readFile(brandLogoAbsolutePath(brandId));
    await prisma.brand.update({
      where: { id: brandId },
      data: { logoPng: fromDisk }
    });
    return fromDisk;
  } catch {
    return null;
  }
}

/** Same-origin path on the public web app (works on brand2school.co.za and www). */
export function brandLogoWebPath(slug: string): string {
  return `/api/public/brand-logo/${encodeURIComponent(slug)}`;
}

export function hasBrandLogo(logoUrl: string | null | undefined): boolean {
  return Boolean(logoUrl?.trim());
}
