"use client";

import { useEffect, useState } from "react";
import { formatCount } from "../../lib/formatCount";
import { emptyPlatformLive, type PlatformLivePayload } from "../../lib/platformLive";

export function ForBrandsLiveProof(): JSX.Element {
  const [live, setLive] = useState<PlatformLivePayload>(emptyPlatformLive());

  useEffect(() => {
    void fetch("/api/platform/live", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setLive(data as PlatformLivePayload);
      })
      .catch(() => null);
  }, []);

  const stats = [
    { label: "Verified participations", value: live.stats.validSubmissions },
    { label: "Schools registered", value: live.stats.schoolsRegistered ?? live.stats.activeSchools },
    { label: "Live campaigns", value: live.stats.activeCampaigns },
    { label: "Provinces active", value: live.stats.provincesActive }
  ];

  return (
    <section className="lp-section lp-section--tight" aria-label="Live platform proof">
      <div className="lp-container">
        <p className="ds-eyebrow">Live platform</p>
        <div className="school-dash-metrics">
          {stats.map((stat) => (
            <article key={stat.label} className="school-dash-metric">
              <strong>{formatCount(stat.value)}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
