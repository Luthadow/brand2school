"use client";

import { FadeIn, ImpactCounter } from "./FadeIn";
import { usePlatformLive } from "./LivePlatformProvider";

export function LiveImpactBand(): JSX.Element {
  const { data } = usePlatformLive();
  const { stats } = data;

  return (
    <div className="lp-metrics-grid">
      <FadeIn>
        <ImpactCounter value={stats.activeSchools} label="School Ecosystems Active" />
      </FadeIn>
      <FadeIn delay={0.05}>
        <ImpactCounter value={stats.validSubmissions} label="Verified Participations" />
      </FadeIn>
      <FadeIn delay={0.1}>
        <ImpactCounter value={stats.submissionsThisMonth} label="This Month" />
      </FadeIn>
      <FadeIn delay={0.15}>
        <ImpactCounter value={stats.provincesActive} label="Provinces Active" />
      </FadeIn>
    </div>
  );
}