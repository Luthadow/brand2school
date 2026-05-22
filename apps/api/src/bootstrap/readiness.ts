import { prisma } from "../lib/prisma.js";
import { registeredSchoolWhere } from "../lib/schoolMetrics.js";
import { env } from "../config/env.js";

export async function readinessCheck(): Promise<{
  ok: boolean;
  checks: Record<string, string>;
}> {
  const checks: Record<string, string> = {
    api: "ok",
    nodeEnv: env.NODE_ENV
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "unavailable";
    return { ok: false, checks };
  }

  try {
    await prisma.$queryRaw`SELECT 1 FROM "User" LIMIT 0`;
    await prisma.$queryRaw`SELECT "currentPhase", "developmentTier", "fundingBalanceZar" FROM "School" LIMIT 0`;
    await prisma.$queryRaw`SELECT 1 FROM "FundingContribution" LIMIT 0`;
    checks.schema = "ok";
  } catch {
    checks.schema = "run_db_migrate_deploy";
    return { ok: false, checks };
  }

  try {
    const [brands, campaigns, codes, users, schoolsRegistered] = await Promise.all([
      prisma.brand.count(),
      prisma.campaign.count({ where: { isActive: true } }),
      prisma.code.count({ where: { status: "UNUSED" } }),
      prisma.user.count(),
      prisma.school.count({ where: registeredSchoolWhere })
    ]);
    checks.seedBrands = String(brands);
    checks.activeCampaigns = String(campaigns);
    checks.unusedCodes = String(codes);
    checks.users = String(users);
    checks.schoolsRegistered = String(schoolsRegistered);
    if (brands === 0 || campaigns === 0) {
      checks.seed = "run_db_seed";
      return { ok: false, checks };
    }
    checks.seed = "ok";
  } catch {
    checks.seed = "unknown";
    return { ok: false, checks };
  }

  return { ok: true, checks };
}
