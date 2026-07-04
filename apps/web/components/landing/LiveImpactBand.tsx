"use client";

import { FadeIn, ImpactCounter } from "./FadeIn";
import { usePlatformLive } from "./LivePlatformProvider";

export function LiveImpactBand(): JSX.Element {
  const { data } = usePlatformLive();
  const { stats } = data;
  const offline = data.dataSource === "offline";

  return (
    <div className="lp-metrics-grid">
      <FadeIn>
        <ImpactCounter
          value={offline ? 0 : stats.schoolsRegistered ?? stats.activeSchools}
          label={offline ? "Schools Registered (API offline)" : "Schools Registered"}
          unavailable={offline}
        />
      </FadeIn>
      <FadeIn delay={0.05}>
        <ImpactCounter
          value={offline ? 0 : stats.validSubmissions}
          label={offline ? "Verified Participations (API offline)" : "Verified Participations"}
          unavailable={offline}
        />
      </FadeIn>
      <FadeIn delay={0.1}>
        <ImpactCounter
          value={offline ? 0 : stats.submissionsThisMonth}
          label="This Month"
          unavailable={offline}
        />
      </FadeIn>
      <FadeIn delay={0.15}>
        <ImpactCounter
          value={offline ? 0 : stats.provincesActive}
          label="Provinces Active"
          unavailable={offline}
        />
      </FadeIn>
    </div>
  );
}