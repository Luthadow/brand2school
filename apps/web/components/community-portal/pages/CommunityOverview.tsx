"use client";

import Link from "next/link";
import type { Route } from "next";
import { Lightbulb, TrendingUp, Trophy, Users } from "lucide-react";
import { formatCount } from "../../../lib/formatCount";
import { useCommunityPortal } from "../CommunityPortalContext";

const REC_ACTIONS: Record<string, Route> = {
  "complete-verification": "/community/dashboard/documents" as Route,
  "first-participation": "/community/dashboard/share" as Route,
  "grow-participation": "/community/dashboard/share" as Route,
  "link-schools": "/community/dashboard/schools" as Route,
  "earn-badges": "/community/dashboard/recognition" as Route
};

export function CommunityOverview(): JSX.Element {
  const portal = useCommunityPortal();
  const { organization, organizationMeta, successCentre, participation, recognition } = portal;
  const { belongingScore, participationScore, recognitionScore, recommendations, stats } = successCentre;

  return (
    <div className="cp-page">
      <header className="cp-success-hero">
        <div>
          <p className="ds-eyebrow">{organizationMeta.portalEyebrow}</p>
          <h1>{organization.name}</h1>
          <p className="cp-muted">
            {organization.district}, {organization.province} · Belonging, participation, and recognition for your
            community ecosystem.
          </p>
        </div>
        <div className="cp-success-scores">
          <div className="cp-success-ring">
            <strong>{belongingScore.percent}%</strong>
            <span>Belonging</span>
          </div>
          <div className="cp-success-ring cp-success-ring--participation">
            <strong>{participationScore.percent}%</strong>
            <span>Participation</span>
          </div>
          <div className="cp-success-ring cp-success-ring--recognition">
            <strong>{recognitionScore.percent}%</strong>
            <span>Recognition</span>
          </div>
        </div>
      </header>

      <section className="cp-success-kpi">
        <article>
          <TrendingUp size={18} />
          <strong>{formatCount(stats.today)}</strong>
          <span>Today</span>
        </article>
        <article>
          <strong>{formatCount(stats.thisWeek)}</strong>
          <span>This week</span>
        </article>
        <article>
          <strong>{formatCount(stats.thisMonth)}</strong>
          <span>This month</span>
        </article>
        <article>
          <Users size={18} />
          <strong>{formatCount(stats.uniqueParticipants)}</strong>
          <span>Participants</span>
        </article>
        <article>
          <strong>{stats.monthGrowthPercent >= 0 ? "+" : ""}{stats.monthGrowthPercent}%</strong>
          <span>Month growth</span>
        </article>
        <article>
          <Trophy size={18} />
          <strong>{recognition.earnedBadges}/{recognition.totalBadges}</strong>
          <span>Badges</span>
        </article>
      </section>

      <div className="cp-success-grid">
        <article className="card cp-success-panel">
          <h2>
            <Lightbulb size={18} /> Smart recommendations
          </h2>
          <ul className="cp-success-recs">
            {recommendations.map((rec) => (
              <li key={rec.id} className={`cp-success-rec cp-success-rec--${rec.priority}`}>
                <p>{rec.message}</p>
                {rec.actionLabel && REC_ACTIONS[rec.id] ? (
                  <Link href={REC_ACTIONS[rec.id]} className="cp-success-rec-link">
                    {rec.actionLabel} →
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </article>

        <article className="card cp-success-panel">
          <h2>Recognition level</h2>
          <p className={`cp-level cp-level--${recognition.level}`}>{recognition.levelLabel}</p>
          <div className="cp-badges">
            {recognition.featured.map((b) => (
              <span key={b.id} className={`cp-chip cp-chip--${b.tier}`}>
                {b.label}
              </span>
            ))}
          </div>
          <p className="cp-muted">
            Engagement score {participation.engagementScore}% · {formatCount(stats.totalVerified)} verified codes
          </p>
          <Link href={"/community/dashboard/recognition" as Route} className="ds-btn ds-btn-secondary ds-btn-sm">
            View champions →
          </Link>
        </article>

        <article className="card cp-success-panel cp-success-panel--wide">
          <h2>Community participation snapshot</h2>
          <div className="cp-snapshot-stats">
            <div>
              <strong>{formatCount(participation.stats.thisMonth)}</strong>
              <span>Verified this month</span>
            </div>
            <div>
              <strong>{participation.stats.districtRank ? `#${participation.stats.districtRank}` : "—"}</strong>
              <span>District rank</span>
            </div>
            <div>
              <strong>{participation.stats.totalAreas}</strong>
              <span>Community segments</span>
            </div>
            <div>
              <strong>{portal.linkedSchools.length}</strong>
              <span>Schools to mobilise</span>
            </div>
          </div>
          <div className="cp-success-actions">
            <Link href={"/community/dashboard/participation" as Route} className="ds-btn ds-btn-secondary ds-btn-sm">
              Full participation stats →
            </Link>
            <Link href={"/community/dashboard/share" as Route} className="ds-btn ds-btn-secondary ds-btn-sm">
              Share kit →
            </Link>
            <Link href={"/community/dashboard/schools" as Route} className="ds-btn ds-btn-secondary ds-btn-sm">
              Linked schools →
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
