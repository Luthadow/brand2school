import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "./prisma.js";
import { apiPublicBaseUrl } from "./publicAssetUrl.js";

export const SCHOOL_LOGO_MAX_BYTES = 5 * 1024 * 1024;

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const schoolUploadsDir = path.join(apiRoot, "uploads", "schools");

export type LogoUploadInput = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

function schoolLogoAbsolutePath(schoolId: string): string {
  return path.join(schoolUploadsDir, `${schoolId}.png`);
}

function schoolLogoStoredPath(schoolId: string): string {
  return `/uploads/schools/${schoolId}.png`;
}

export async function persistSchoolLogo(
  schoolId: string,
  file: LogoUploadInput
): Promise<{ storedPath: string }> {
  if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg" && file.mimetype !== "image/webp") {
    throw new Error("Logo must be PNG, JPEG, or WebP.");
  }
  if (file.size > SCHOOL_LOGO_MAX_BYTES) {
    throw new Error("Logo must be 5MB or smaller.");
  }

  await fs.mkdir(schoolUploadsDir, { recursive: true });
  await fs.writeFile(schoolLogoAbsolutePath(schoolId), file.buffer);
  const storedPath = schoolLogoStoredPath(schoolId);
  await prisma.school.update({
    where: { id: schoolId },
    data: { logoUrl: storedPath, logoPng: file.buffer }
  });
  return { storedPath };
}

export async function readSchoolLogoBuffer(schoolId: string): Promise<Buffer | null> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { logoPng: true, logoUrl: true }
  });
  if (!school?.logoUrl) return null;

  if (school.logoPng && school.logoPng.length > 0) {
    return Buffer.from(school.logoPng);
  }

  try {
    const fromDisk = await fs.readFile(schoolLogoAbsolutePath(schoolId));
    await prisma.school.update({
      where: { id: schoolId },
      data: { logoPng: fromDisk }
    });
    return fromDisk;
  } catch {
    return null;
  }
}

export function schoolLogoWebPath(schoolCode: string): string {
  const base = apiPublicBaseUrl().replace(/\/$/, "");
  return `${base}/api/v1/platform/school-logo/${encodeURIComponent(schoolCode)}`;
}

export function hasSchoolLogo(logoUrl: string | null | undefined): boolean {
  return Boolean(logoUrl?.trim());
}
