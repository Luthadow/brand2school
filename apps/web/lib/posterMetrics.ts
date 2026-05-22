import { emptyPlatformCredibility, fetchPlatformCredibility } from "./platformCredibility";
import { emptyPlatformLive, fetchPlatformLive } from "./platformLive";

export type PosterMetric = {
  value: number;
  label: string;
};

function kpiValue(
  kpis: { key: string; value: number }[],
  key: string
): number {
  return kpis.find((k) => k.key === key)?.value ?? 0;
}

export async function fetchPosterMetrics(): Promise<{
  metrics: PosterMetric[];
  updatedAt: string;
  apiReachable: boolean;
}> {
  const [liveRaw, credRaw] = await Promise.all([fetchPlatformLive(), fetchPlatformCredibility()]);
  const live = liveRaw ?? emptyPlatformLive();
  const cred = credRaw ?? emptyPlatformCredibility();
  const apiReachable = liveRaw !== null || credRaw !== null;

  const metrics: PosterMetric[] = [
    { value: live.stats.validSubmissions, label: "Verified participations" },
    { value: live.stats.schoolsRegistered ?? live.stats.activeSchools, label: "Schools registered" },
    {
      value: kpiValue(cred.kpis, "infrastructureMilestones"),
      label: "Infrastructure milestones"
    }
  ];

  const updatedAt =
    liveRaw?.updatedAt && credRaw?.updatedAt
      ? liveRaw.updatedAt > credRaw.updatedAt
        ? liveRaw.updatedAt
        : credRaw.updatedAt
      : liveRaw?.updatedAt ?? credRaw?.updatedAt ?? new Date().toISOString();

  return { metrics, updatedAt, apiReachable };
}
