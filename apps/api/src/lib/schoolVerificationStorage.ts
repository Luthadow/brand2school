import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { toPublicAssetUrl } from "./publicAssetUrl.js";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const schoolVerificationUploadsDir = path.join(apiRoot, "uploads", "schools", "verification");

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

export function assertAllowedVerificationMime(mimetype: string): void {
  if (!ALLOWED_MIME.has(mimetype)) {
    throw new Error("File must be PDF, JPEG, PNG, or WebP.");
  }
}

function extensionForMime(mimetype: string): string {
  if (mimetype === "application/pdf") return "pdf";
  if (mimetype === "image/png") return "png";
  if (mimetype === "image/webp") return "webp";
  return "jpg";
}

export function schoolVerificationDocPath(
  schoolId: string,
  docType: string,
  mimetype: string
): string {
  const ext = extensionForMime(mimetype);
  return `/uploads/schools/verification/${schoolId}/${docType}.${ext}`;
}

export function absoluteSchoolVerificationPath(storedPath: string): string {
  const rel = storedPath.replace(/^\/uploads\/schools\/verification\//, "");
  return path.join(schoolVerificationUploadsDir, rel);
}

export async function saveSchoolVerificationFile(storedPath: string, buffer: Buffer): Promise<string> {
  const abs = absoluteSchoolVerificationPath(storedPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buffer);
  return storedPath;
}

export function resolveSchoolVerificationPublicUrl(storedPath: string | null): string | null {
  return toPublicAssetUrl(storedPath);
}
