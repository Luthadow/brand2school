import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";
import { sha256 } from "./crypto.js";
import { queueEmail } from "./notifications/dispatch.js";
import { sendPasswordChangedEmail } from "./mail.js";


function resetAppBaseUrl(role: string): string {
  if (role === "SUPER_ADMIN" || role === "ADMIN_STAFF") {
    return env.ADMIN_WEB_APP_URL.replace(/\/$/, "");
  }
  return env.WEB_APP_URL.replace(/\/$/, "");
}

export function createPasswordResetToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Request a password reset. Never reveals whether the email exists.
 * Passwords are never retrieved — only reset via one-time token.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) return;

  if (user.status === "SUSPENDED") {
    return;
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentRequests = await prisma.passwordResetToken.count({
    where: { userId: user.id, createdAt: { gte: hourAgo } }
  });
  if (recentRequests >= env.PASSWORD_RESET_MAX_PER_HOUR) {
    return;
  }

  const rawToken = createPasswordResetToken();
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_EXPIRES_MINUTES * 60 * 1000);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() }
    }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt }
    }),
    prisma.auditLog.create({
      data: {
        action: "PASSWORD_RESET_REQUESTED",
        targetType: "USER",
        targetId: user.id,
        payload: { email: normalized }
      }
    })
  ]);

  const resetUrl = `${resetAppBaseUrl(user.role)}/reset-password?token=${encodeURIComponent(rawToken)}`;

  try {
    await queueEmail({
      template: "PASSWORD_RESET",
      recipient: user.email,
      entityType: "USER",
      entityId: user.id,
      immediate: true,
      priority: 10,
      payload: {
        fullName: user.fullName,
        resetUrl,
        expiresMinutes: env.PASSWORD_RESET_EXPIRES_MINUTES
      }
    });
  } catch (err) {
    console.error("[mail] Failed to queue password reset email:", err);
  }
}

export async function validatePasswordResetToken(
  token: string
): Promise<{ valid: boolean; expired?: boolean }> {
  const tokenHash = sha256(token.trim());
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { usedAt: true, expiresAt: true }
  });
  if (!record || record.usedAt) return { valid: false };
  if (record.expiresAt < new Date()) return { valid: false, expired: true };
  return { valid: true };
}

export async function completePasswordReset(token: string, newPassword: string): Promise<boolean> {
  const tokenHash = sha256(token.trim());
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return false;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() }
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() }
    }),
    prisma.refreshSession.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() }
    }),
    prisma.auditLog.create({
      data: {
        action: "PASSWORD_RESET_COMPLETED",
        targetType: "USER",
        targetId: record.userId,
        payload: { method: "reset_token" }
      }
    })
  ]);

  void sendPasswordChangedEmail({
    to: record.user.email,
    fullName: record.user.fullName
  }).catch((err) => console.error("[mail] password changed notification failed:", err));

  return true;
}
