import { prisma } from "../../../lib/prisma.js";

export type CampaignProgress = {
  validSubmissions: number;
  targetSubmissions: number;
  percentToTarget: number;
  remainingToTarget: number;
};

export async function getSchoolCampaignProgress(
  schoolId: string,
  campaignId: string,
  targetSubmissions: number
): Promise<CampaignProgress> {
  const validSubmissions = await prisma.submission.count({
    where: {
      schoolId,
      campaignId,
      state: "VALID"
    }
  });

  const target = Math.max(targetSubmissions, 1);
  const percentToTarget = Math.min(100, Math.round((validSubmissions / target) * 100));

  return {
    validSubmissions,
    targetSubmissions: target,
    percentToTarget,
    remainingToTarget: Math.max(0, target - validSubmissions)
  };
}
