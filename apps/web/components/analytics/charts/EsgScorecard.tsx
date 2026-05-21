import { Activity, MapPin, School, Shield, Target, TrendingUp } from "lucide-react";
import { formatCount } from "../../../lib/formatCount";
import type { BrandAnalytics } from "../../../lib/analytics";

export function EsgScorecard({ summary }: { summary: BrandAnalytics["summary"] }): JSX.Element {
  const cards = [
    { label: "Verified submissions", value: formatCount(summary.validSubmissions), icon: Activity, hint: "Trust signal" },
    { label: "Schools impacted", value: formatCount(summary.schoolsReached), icon: School, hint: "Social proof" },
    { label: "Verification rate", value: `${summary.verificationRate}%`, icon: Shield, hint: "Integrity" },
    { label: "Provinces reached", value: formatCount(summary.provincesReached), icon: MapPin, hint: "National scale" },
    { label: "Active campaigns", value: formatCount(summary.activeCampaigns), icon: Target, hint: "Momentum" },
    { label: "Code utilization", value: `${summary.codeUtilization}%`, icon: TrendingUp, hint: "Engagement" }
  ];

  return (
    <div className="ba-esg-scorecard">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.label} className="ba-esg-card">
            <Icon size={20} />
            <strong>{card.value}</strong>
            <span>{card.label}</span>
            <small>{card.hint}</small>
          </article>
        );
      })}
    </div>
  );
}
