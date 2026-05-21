"use client";

import Link from "next/link";
import type { Route } from "next";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { formatCount } from "../../lib/formatCount";
import { CampaignScopeBadge } from "../campaigns/CampaignScopeBadge";
import { FadeIn } from "./FadeIn";
import { usePlatformLive } from "./LivePlatformProvider";
export function LiveCampaignsPanel(): JSX.Element {
  const { data, pulsing } = usePlatformLive();
  const { campaigns } = data;

  return (
    <motion.div
      className="lp-campaign-grid"
      animate={pulsing ? { opacity: [1, 0.96, 1] } : { opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      {campaigns.length === 0 ? (
        <p className="lp-live-empty lp-live-empty--campaigns">
          Active brand campaigns will appear here as partners launch on Brand2School.
        </p>
      ) : (
        campaigns.map((c, i) => (
          <FadeIn key={c.id} delay={i * 0.08}>
            <Link href={`/campaigns/${c.slug}` as Route} className="lp-campaign-card pp-campaign-link">
              <div className="lp-campaign-header">
                <div>
                  <h3>{c.name}</h3>
                  <CampaignScopeBadge campaign={c} />
                  <span className="lp-campaign-province">
                    <MapPin size={14} />
                    {c.brandName}
                    {c.category ? ` · ${c.category}` : ""}
                  </span>
                </div>
                <span className="lp-campaign-learners">{c.schoolsParticipating} schools</span>
              </div>
              <p className="lp-campaign-goal">
                {c.infrastructureGoal ?? "Verified community participation toward school infrastructure goals."}
              </p>
              <div className="lp-campaign-bar-wrap">
                <motion.div
                  className="lp-campaign-bar"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(c.percentToTarget, 3)}%` }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <div className="lp-campaign-footer">
                <span className="lp-campaign-pct">
                  {c.percentToTarget}% · {formatCount(c.validSubmissions)} / {formatCount(c.targetSubmissions)} verified
                </span>
                <span className="lp-campaign-live">
                  <span className="ds-live-dot" />
                  Live
                </span>
              </div>
            </Link>
          </FadeIn>
        ))
      )}
    </motion.div>
  );
}
