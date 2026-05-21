import { prisma } from "../../lib/prisma.js";
import { buildInfrastructureProfile, type InfrastructureItemRecord } from "./infrastructureProgress.js";

export type NationalSchoolScoreRow = {
  rank: number;
  schoolId: string;
  schoolName: string;
  province: string;
  district: string;
  nationalScore: number;
  currentPhase: number;
  fundingBalanceZar: number;
};

export async function getNationalSchoolScores(limit = 50): Promise<NationalSchoolScoreRow[]> {
  const schools = await prisma.school.findMany({
    where: { status: { in: ["ACTIVE", "APPROVED", "VERIFIED"] } },
    select: {
      id: true,
      name: true,
      province: true,
      district: true,
      currentPhase: true,
      infrastructureItems: true,
      phaseHistory: true,
      fundingBalanceZar: true,
      _count: { select: { submissions: { where: { state: "VALID" } } } }
    },
    take: 200
  });

  const scored = schools.map((school) => {
    const profile = buildInfrastructureProfile({
      schoolId: school.id,
      storedItems: school.infrastructureItems as InfrastructureItemRecord[] | null,
      storedPhase: school.currentPhase,
      phaseHistory: (school.phaseHistory as Record<string, string> | null) ?? undefined,
      validSubmissions: school._count.submissions
    });
    return {
      schoolId: school.id,
      schoolName: school.name,
      province: school.province,
      district: school.district,
      nationalScore: profile.nationalScore,
      currentPhase: profile.activePhase,
      fundingBalanceZar: Number(school.fundingBalanceZar ?? 0)
    };
  });

  scored.sort((a, b) => b.nationalScore - a.nationalScore || b.fundingBalanceZar - a.fundingBalanceZar);

  return scored.slice(0, limit).map((row, index) => ({
    rank: index + 1,
    ...row
  }));
}
