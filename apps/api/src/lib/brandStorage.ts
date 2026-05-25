import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { toPublicAssetUrl } from "./publicAssetUrl.js";

export const BRAND_LOGO_MAX_BYTES = 15 * 1024 * 1024;
const MIN_DIMENSION = 512;

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const brandUploadsDir = path.join(apiRoot, "uploads", "brands");

type LogoUpload = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

async function readPngDimensions(buffer: Buffer): Promise<{ width: number; height: number } | null> {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function brandLogoStoredPath(brandId: string): string {
  return `/uploads/brands/${brandId}.png`;
}

export function brandLogoAbsolutePath(brandId: string): string {
  return path.join(brandUploadsDir, `${brandId}.png`);
}

export async function saveBrandLogo(brandId: string, file: LogoUpload): Promise<string> {
  if (file.mimetype !== "image/png") {
    throw new Error("Logo must be a PNG file.");
  }
  if (file.size > BRAND_LOGO_MAX_BYTES) {
    throw new Error("Logo must be 15MB or smaller.");
  }

  const dims = await readPngDimensions(file.buffer);
  if (!dims || dims.width < MIN_DIMENSION || dims.height < MIN_DIMENSION) {
    throw new Error("Logo must be at least 512×512 pixels (PNG).");
  }

  await fs.mkdir(brandUploadsDir, { recursive: true });
  await fs.writeFile(brandLogoAbsolutePath(brandId), file.buffer);
  return brandLogoStoredPath(brandId);
}

export async function removeBrandLogoFile(brandId: string, logoUrl: string | null): Promise<void> {
  if (logoUrl?.startsWith("http://") || logoUrl?.startsWith("https://")) {
    return;
  }
  try {
    await fs.unlink(brandLogoAbsolutePath(brandId));
  } catch {
    /* ignore */
  }
}

export function resolveLogoPublicUrl(logoUrl: string | null): string | null {
  return toPublicAssetUrl(logoUrl);
}
