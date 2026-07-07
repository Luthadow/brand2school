import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { sha256 } from "../../lib/crypto.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";
import { requireAuth } from "../../middleware/auth.js";
import { authRateLimit, passwordResetRateLimit } from "../../middleware/rateLimit.js";
import {
  completePasswordReset,
  requestPasswordReset,
  validatePasswordResetToken
} from "../../lib/passwordReset.js";
import { strongPasswordSchema } from "../../lib/passwordPolicy.js";

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["SCHOOL_ADMIN", "BRAND_ADMIN", "JUDGE"])
});

const loginSchema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

const revokeSessionSchema = z.object({
  sessionId: z.string().cuid()
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(32),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(8)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
  });

export const authRouter = Router();

authRouter.post("/register", authRateLimit, async (req, res) => {
  const payload = registerSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const exists = await prisma.user.findUnique({ where: { email: payload.data.email } });
  if (exists) {
    res.status(409).json({ message: "Email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(payload.data.password, 10);
  const user = await prisma.user.create({
    data: {
      fullName: payload.data.fullName,
      email: payload.data.email,
      passwordHash,
      role: payload.data.role
    }
  });

  res.status(201).json({ id: user.id, email: user.email, role: user.role, status: user.status });
});

authRouter.post("/forgot-password", passwordResetRateLimit, async (req, res) => {
  const payload = forgotPasswordSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  await requestPasswordReset(payload.data.email);
  res.json({
    message:
      "If an account exists for that email, we sent password reset instructions. Passwords cannot be retrieved — only reset."
  });
});

authRouter.get("/reset-password/validate", authRateLimit, async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (token.length < 32) {
    res.json({ valid: false });
    return;
  }
  const result = await validatePasswordResetToken(token);
  res.json(result);
});

authRouter.post("/reset-password", authRateLimit, async (req, res) => {
  const payload = resetPasswordSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const ok = await completePasswordReset(payload.data.token, payload.data.password);
  if (!ok) {
    res.status(400).json({ message: "This reset link is invalid or has expired." });
    return;
  }

  res.json({ message: "Your password has been updated. You can sign in now." });
});

authRouter.post("/login", authRateLimit, async (req, res) => {
  const payload = loginSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: payload.data.email } });
  if (!user) {
    res.status(401).json({ message: "Invalid credentials." });
    return;
  }

  if (user.status === "SUSPENDED") {
    res.status(403).json({
      message: "This account is suspended. Contact support@brand2school.co.za for assistance."
    });
    return;
  }

  const valid = await bcrypt.compare(payload.data.password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Invalid credentials." });
    return;
  }

  const tokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    ...(user.brandId ? { brandId: user.brandId } : {})
  };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);
  const refreshTokenHash = sha256(refreshToken);

  await prisma.refreshSession.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  const school = user.schoolId
    ? await prisma.school.findUnique({
        where: { id: user.schoolId },
        select: { organizationCategory: true, schoolCode: true }
      })
    : null;

  res.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      brandId: user.brandId,
      organizationCategory: school?.organizationCategory ?? null,
      organisationCode: school?.schoolCode ?? null
    },
    accessToken,
    refreshToken
  });
});

authRouter.post("/refresh", authRateLimit, async (req, res) => {
  const payload = refreshSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  try {
    const tokenData = verifyRefreshToken(payload.data.refreshToken);
    const tokenHash = sha256(payload.data.refreshToken);

    const session = await prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: true }
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      res.status(401).json({ message: "Refresh session is invalid." });
      return;
    }

    const nextPayload = { sub: tokenData.sub, email: tokenData.email, role: tokenData.role };
    const accessToken = signAccessToken(nextPayload);
    const refreshToken = signRefreshToken(nextPayload);
    const nextTokenHash = sha256(refreshToken);

    await prisma.$transaction([
      prisma.refreshSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date(), lastUsedAt: new Date() }
      }),
      prisma.refreshSession.create({
        data: {
          userId: session.userId,
          tokenHash: nextTokenHash,
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
          lastUsedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })
    ]);

    res.json({ accessToken, refreshToken });
  } catch {
    res.status(401).json({ message: "Invalid refresh token." });
  }
});

authRouter.post("/logout", requireAuth, async (req, res) => {
  const payload = refreshSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const tokenHash = sha256(payload.data.refreshToken);
  const session = await prisma.refreshSession.findUnique({
    where: { tokenHash }
  });

  if (!session) {
    res.status(200).json({ message: "Logged out." });
    return;
  }

  if (req.user && session.userId !== req.user.id) {
    res.status(403).json({ message: "Forbidden." });
    return;
  }

  await prisma.refreshSession.update({
    where: { id: session.id },
    data: { revokedAt: new Date(), lastUsedAt: new Date() }
  });

  res.json({ message: "Logged out." });
});

authRouter.get("/sessions", requireAuth, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  const sessions = await prisma.refreshSession.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
      revokedAt: true,
      userAgent: true,
      ipAddress: true
    }
  });

  res.json({ sessions });
});

authRouter.post("/sessions/revoke-all", requireAuth, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  const updated = await prisma.refreshSession.updateMany({
    where: {
      userId: req.user.id,
      revokedAt: null
    },
    data: { revokedAt: new Date() }
  });

  res.json({ revokedCount: updated.count });
});

authRouter.post("/sessions/revoke", requireAuth, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  const payload = revokeSessionSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const session = await prisma.refreshSession.findUnique({
    where: { id: payload.data.sessionId }
  });
  if (!session || session.userId !== req.user.id) {
    res.status(404).json({ message: "Session not found." });
    return;
  }

  await prisma.refreshSession.update({
    where: { id: session.id },
    data: { revokedAt: new Date() }
  });

  res.json({ message: "Session revoked." });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, fullName: true, email: true, role: true, status: true, createdAt: true }
  });
  if (!user) {
    res.status(404).json({ message: "User not found." });
    return;
  }

  res.json({ user });
});
