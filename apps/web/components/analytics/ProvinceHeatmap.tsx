"use client";

import type { ProvinceMetric } from "../../lib/analytics";
import { formatCount } from "../../lib/formatCount";

function heatClass(intensity: number): string {
  if (intensity >= 75) return "ba-heat--high";
  if (intensity >= 45) return "ba-heat--mid";
  if (intensity >= 20) return "ba-heat--low";
  return "ba-heat--min";
}

export function ProvinceHeatmap({ provinces }: { provinces: ProvinceMetric[] }): JSX.Element {
  const sorted = [...provinces].sort((a, b) => b.submissions - a.submissions);

  return (
    <div className="ba-heatmap">
      <div className="ba-heatmap-grid">
        {sorted.map((p) => (
          <article
            key={p.code}
            className={`ba-heat-cell ${heatClass(p.intensity)}`}
            title={`${p.name}: ${formatCount(p.submissions)} submissions`}
          >
            <span className="ba-heat-code">{p.code}</span>
            <strong className="ba-heat-count">{formatCount(p.submissions)}</strong>
            <span className="ba-heat-name">{p.name}</span>
            <div className="ba-heat-meta">
              <span>{p.schools} schools</span>
              <span>{formatCount(p.learners)} participations</span>
            </div>
          </article>
        ))}
      </div>
      <div className="ba-heat-legend" aria-hidden="true">
        <span>Lower</span>
        <div className="ba-heat-legend-bar" />
        <span>Higher participation</span>
      </div>
    </div>
  );
}
