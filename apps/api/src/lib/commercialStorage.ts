import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { toPublicAssetUrl } from "./publicAssetUrl.js";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const commercialUploadsDir = path.join(apiRoot, "uploads", "commercial");

export function agreementGeneratedPath(brandId: string, version: number): string {
  return `/uploads/commercial/agreements/${brandId}-v${version}-draft.pdf`;
}

export function agreementSignedPath(brandId: string, version: number): string {
  return `/uploads/commercial/agreements/${brandId}-v${version}-signed.pdf`;
}

export function absoluteCommercialPath(storedPath: string): string {
  const rel = storedPath.replace(/^\/uploads\/commercial\//, "");
  return path.join(commercialUploadsDir, rel);
}

export async function saveCommercialPdf(storedPath: string, buffer: Buffer): Promise<string> {
  const abs = absoluteCommercialPath(storedPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buffer);
  return storedPath;
}

export function resolveCommercialPublicUrl(storedPath: string | null): string | null {
  return toPublicAssetUrl(storedPath);
}
