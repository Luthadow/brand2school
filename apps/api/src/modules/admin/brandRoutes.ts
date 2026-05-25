import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { removeBrandLogoFile, resolveLogoPublicUrl, saveBrandLogo } from "../../lib/brandAssets.js";
import { requireRole } from "../../middleware/auth.js";
import { applyManualBrandVerificationPatch } from "../platform/syncBrandVerification.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }
});

const listQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["PENDING", "VERIFIED", "APPROVED", "ACTIVE", "SUSPENDED"]).optional(),
  verificationStatus: z
    .enum(["PENDING", "VERIFIED", "FOUNDER_VERIFIED", "SUSPENDED", "REJECTED"])
    .optional(),
  featuredOnHome: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional()
});

const patchBrandSchema = z.object({
  websiteUrl: z.string().url().optional().nullable(),
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  featuredOnHome: z.boolean().optional(),
  homeSortOrder: z.number().int().min(0).max(9999).optional(),
  founderExempt: z.boolean().optional(),
  verificationStatus: z
    .enum(["PENDING", "VERIFIED", "FOUNDER_VERIFIED", "SUSPENDED", "REJECTED"])
    .optional(),
  publicProfileEnabled: z.boolean().optional(),
  description: z.string().max(2000).optional().nullable(),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .min(2)
    .max(48)
    .optional()
});

function serializeBrand(brand: {
  id: string;
  name: string;
  codePrefix: string;
  slug: string;
  status: string;
  logoUrl: string | null;
  featuredOnHome: boolean;
  homeSortOrder: number;
  founderExempt: boolean;
  verificationCode: string | null;
  verificationStatus: string;
  verifiedAt: Date | null;
  publicProfileEnabled: boolean;
  description: string | null;
  websiteUrl: string | null;
  brandColor: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: brand.id,
    name: brand.name,
    codePrefix: brand.codePrefix,
    slug: brand.slug,
    status: brand.status,
    logoUrl: resolveLogoPublicUrl(brand.logoUrl),
    featuredOnHome: brand.featuredOnHome,
    homeSortOrder: brand.homeSortOrder,
    founderExempt: brand.founderExempt,
    verificationCode: brand.verificationCode,
    verificationStatus: brand.verificationStatus,
    verifiedAt: brand.verifiedAt?.toISOString() ?? null,
    verifyUrl: brand.verificationCode ? `/verify/${brand.verificationCode}` : null,
    certificatePdfUrl:
      brand.verificationCode &&
      (brand.verificationStatus === "VERIFIED" || brand.verificationStatus === "FOUNDER_VERIFIED")
        ? `/api/v1/platform/verify/${encodeURIComponent(brand.verificationCode)}/certificate`
        : null,
    publicProfileEnabled: brand.publicProfileEnabled,
    description: brand.description,
    websiteUrl: brand.websiteUrl,
    brandColor: brand.brandColor,
    publicProfileUrl: `/brand/${brand.slug}`,
    createdAt: brand.createdAt.toISOString(),
    updatedAt: brand.updatedAt.toISOString()
  };
}

export const adminBrandRouter = Router();

adminBrandRouter.get("/brands", async (req, res) => {
  const query = listQuerySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ message: "Validation failed.", issues: query.error.flatten() });
    return;
  }

  const page = query.data.page ?? 1;
  const pageSize = query.data.pageSize ?? 25;
  const where = {
    ...(query.data.status ? { status: query.data.status } : {}),
    ...(query.data.verificationStatus
      ? { verificationStatus: query.data.verificationStatus }
      : {}),
    ...(query.data.featuredOnHome !== undefined ? { featuredOnHome: query.data.featuredOnHome } : {}),
    ...(query.data.search
      ? {
          OR: [
            { name: { contains: query.data.search, mode: "insensitive" as const } },
            { codePrefix: { contains: query.data.search, mode: "insensitive" as const } },
            { slug: { contains: query.data.search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };

  const [total, brands] = await prisma.$transaction([
    prisma.brand.count({ where }),
    prisma.brand.findMany({
      where,
      orderBy: [{ homeSortOrder: "asc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);

  res.json({
    total,
    page,
    pageSize,
    items: brands.map(serializeBrand)
  });
});

adminBrandRouter.get("/brands/:id", async (req, res) => {
  const brand = await prisma.brand.findUnique({ where: { id: req.params.id } });
  if (!brand) {
    res.status(404).json({ message: "Brand not found." });
    return;
  }
  res.json(serializeBrand(brand));
});

adminBrandRouter.patch("/brands/:id", requireRole(["SUPER_ADMIN"]), async (req, res) => {
  const payload = patchBrandSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const brand = await prisma.brand.findUnique({ where: { id: req.params.id } });
  if (!brand) {
    res.status(404).json({ message: "Brand not found." });
    return;
  }

  if (payload.data.featuredOnHome === true && brand.status !== "ACTIVE") {
    res.status(409).json({
      message: "Only ACTIVE brands can be featured on the homepage."
    });
    return;
  }

  if (payload.data.featuredOnHome === true && !brand.logoUrl) {
    res.status(409).json({
      message: "Upload a logo before featuring this brand on the homepage."
    });
    return;
  }

  if (payload.data.publicProfileEnabled === true && brand.status !== "ACTIVE") {
    res.status(409).json({ message: "Only ACTIVE brands can have a public profile." });
    return;
  }

  if (payload.data.slug && payload.data.slug !== brand.slug) {
    const taken = await prisma.brand.findUnique({ where: { slug: payload.data.slug } });
    if (taken && taken.id !== brand.id) {
      res.status(409).json({ message: "Slug already in use." });
      return;
    }
  }

  const verificationPatch =
    payload.data.verificationStatus !== undefined
      ? { verificationStatus: payload.data.verificationStatus }
      : payload.data.founderExempt === true
        ? { verificationStatus: "FOUNDER_VERIFIED" as const }
        : {};

  const updated = await prisma.brand.update({
    where: { id: brand.id },
    data: {
      ...(payload.data.websiteUrl !== undefined ? { websiteUrl: payload.data.websiteUrl } : {}),
      ...(payload.data.brandColor !== undefined ? { brandColor: payload.data.brandColor } : {}),
      ...(payload.data.featuredOnHome !== undefined ? { featuredOnHome: payload.data.featuredOnHome } : {}),
      ...(payload.data.homeSortOrder !== undefined ? { homeSortOrder: payload.data.homeSortOrder } : {}),
      ...(payload.data.founderExempt !== undefined ? { founderExempt: payload.data.founderExempt } : {}),
      ...verificationPatch,
      ...(payload.data.publicProfileEnabled !== undefined
        ? { publicProfileEnabled: payload.data.publicProfileEnabled }
        : {}),
      ...(payload.data.description !== undefined ? { description: payload.data.description } : {}),
      ...(payload.data.slug !== undefined ? { slug: payload.data.slug } : {})
    }
  });

  const actorId = req.user?.id;
  await applyManualBrandVerificationPatch(
    prisma,
    brand.id,
    {
      ...(payload.data.verificationStatus !== undefined
        ? { verificationStatus: payload.data.verificationStatus }
        : {}),
      ...(payload.data.founderExempt !== undefined ? { founderExempt: payload.data.founderExempt } : {})
    },
    actorId
  );

  const fresh = await prisma.brand.findUnique({ where: { id: brand.id } });
  res.json(serializeBrand(fresh ?? updated));
});

adminBrandRouter.post(
  "/brands/:id/logo",
  requireRole(["SUPER_ADMIN"]),
  upload.single("logo"),
  async (req, res) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "Missing logo file (field name: logo)." });
      return;
    }

    const brand = await prisma.brand.findUnique({ where: { id: req.params.id } });
    if (!brand) {
      res.status(404).json({ message: "Brand not found." });
      return;
    }

    try {
      const storedPath = await saveBrandLogo(brand.id, file);
      const updated = await prisma.brand.update({
        where: { id: brand.id },
        data: { logoUrl: storedPath }
      });
      res.json(serializeBrand(updated));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logo upload failed.";
      res.status(400).json({ message });
    }
  }
);

adminBrandRouter.delete("/brands/:id/logo", requireRole(["SUPER_ADMIN"]), async (req, res) => {
  const brand = await prisma.brand.findUnique({ where: { id: req.params.id } });
  if (!brand) {
    res.status(404).json({ message: "Brand not found." });
    return;
  }

  await removeBrandLogoFile(brand.id, brand.logoUrl);
  const updated = await prisma.brand.update({
    where: { id: brand.id },
    data: {
      logoUrl: null,
      featuredOnHome: false
    }
  });

  res.json(serializeBrand(updated));
});
