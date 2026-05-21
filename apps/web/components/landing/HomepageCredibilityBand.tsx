import Link from "next/link";
import type { Route } from "next";
import { Shield, TrendingUp } from "lucide-react";
import type { PlatformCredibilityPayload } from "../../lib/platformCredibility";
import { formatCount } from "../../lib/formatCount";
import { FadeIn, ImpactCounter } from "./FadeIn";

const PRIMARY_KEYS = [
  "verifiedSubmissions",
  "schoolsImpacted",
  "fraudBlocked",
  "provincesReached",
  "activeCampaigns",
  "infrastructureMilestones"
] as const;

export function HomepageCredibilityBand({
  credibility
}: {
  credibility: PlatformCredibilityPayload;
}): JSX.Element {
  const primary = PRIMARY_KEYS.map((key) => credibility.kpis.find((kpi) => kpi.key === key)).filter(
    (kpi): kpi is NonNullable<typeof kpi> => Boolean(kpi)
  );

  return (
    <div className="lp-credibility-band">
      <div className="lp-credibility-kpis">
        {primary.map((kpi, index) => (
          <FadeIn key={kpi.key} delay={index * 0.05}>
            <article className="lp-credibility-kpi">
              <ImpactCounter value={kpi.value} label={kpi.label} />
              <span className="lp-credibility-hint">{kpi.hint}</span>
            </article>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={0.2} className="lp-credibility-trust-card">
        <div className="lp-credibility-trust-head">
          <Shield size={22} />
          <div>
            <h3>Can this platform be trusted?</h3>
            <p>
              {formatCount(credibility.fraudBlocked)} fraud attempts blocked. Every metric below is live from verified
              participation — not marketing copy.
            </p>
          </div>
        </div>
        <ul className="lp-credibility-protections">
          {credibility.protections.slice(0, 4).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <Link href={"/movement" as Route} className="ds-btn ds-btn-secondary ds-btn-sm">
          <TrendingUp size={16} />
          Watch the movement live
        </Link>
      </FadeIn>
    </div>
  );
}
