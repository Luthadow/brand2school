"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Landmark,
  School,
  type LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  building: Building2,
  school: School,
  landmark: Landmark
};

type AudienceTab = {
  id: string;
  label: string;
  icon: string;
  headline: string;
  points: string[];
  ctaHref?: string;
  ctaLabel?: string;
};

export function AudienceTabs({ tabs }: { tabs: AudienceTab[] }): JSX.Element {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  const Icon = iconMap[current.icon] ?? Building2;

  return (
    <div className="ds-audience">
      <div className="ds-audience-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            className={`ds-audience-tab${active === tab.id ? " ds-audience-tab--active" : ""}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="ds-audience-panel" role="tabpanel">
        <div className="ds-audience-panel-icon">
          <Icon size={32} strokeWidth={1.75} />
        </div>
        <h3>{current.headline}</h3>
        <ul>
          {current.points.map((point) => (
            <li key={point}>
              <CheckCircle2 size={18} />
              {point}
            </li>
          ))}
        </ul>
        {current.ctaHref ? (
          <Link href={current.ctaHref as Route} className="ds-btn ds-btn-primary ds-audience-cta">
            {current.ctaLabel ?? "Learn more"}
          </Link>
        ) : null}
      </div>
    </div>
  );
}