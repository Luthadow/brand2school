import { z } from "zod";

const SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export const passwordPolicyRules = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  recommendSpecial: true
} as const;

export function validatePasswordStrength(password: string): string | null {
  if (password.length < passwordPolicyRules.minLength) {
    return `Password must be at least ${passwordPolicyRules.minLength} characters.`;
  }
  if (passwordPolicyRules.requireUppercase && !/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter.";
  }
  if (passwordPolicyRules.requireLowercase && !/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter.";
  }
  if (passwordPolicyRules.requireNumber && !/[0-9]/.test(password)) {
    return "Password must include at least one number.";
  }
  if (passwordPolicyRules.recommendSpecial && !SPECIAL.test(password)) {
    return "Password must include at least one special character (!@#$…).";
  }
  return null;
}

export const strongPasswordSchema = z
  .string()
  .min(passwordPolicyRules.minLength)
  .superRefine((value, ctx) => {
    const message = validatePasswordStrength(value);
    if (message) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    }
  });
