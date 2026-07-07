"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { Share2, Users } from "lucide-react";
import { formatCount } from "../../../lib/formatCount";
import { useCommunityPortal } from "../CommunityPortalContext";

export function CommunityParticipationPage(): JSX.Element {
  const { organization, organizationMeta, participation, shareKit } = useCommunityPortal();
  const [copied, setCopied] = useState<string | null>(null);
  const maxWeekday = Math.max(...participation.weekdayActivity.map((d) => d.count), 1);

  async function copyText(text: string, key: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="cp-page cp-participation-page">
      <header className="cp-participation-hero">
        <div>
          <p className="ds-eyebrow">Participation</p>
          <h1>{organizationMeta.label} impact</h1>
          <p className="cp-muted">
            Track verified participation across {organization.district} — who drives momentum and how to grow it.
          </p>
        </div>
        <div className="cp-participation-score">
          <strong>{participation.engagementScore}%</strong>
          <span>Engagement score</span>
        </div>
      </header>

      <section className="cp-participation-kpi">
        <article>
          <Users size={18} />
          <strong>{formatCount(participation.stats.uniqueParticipants)}</strong>
          <span>Unique participants</span>
        </article>
        <article>
          <strong>{participation.stats.totalAreas}</strong>
          <span>Segments</span>
        </article>
        <article>
          <strong>{participation.stats.learnerSharePercent}%</strong>
          <span>Learner share</span>
        </article>
        <article>
          <strong>
            {participation.stats.districtRank ? `#${participation.stats.districtRank}` : "—"}
          </strong>
          <span>District rank</span>
        </article>
        <article>
          <strong>
            {participation.stats.monthGrowthPercent >= 0 ? "+" : ""}
            {participation.stats.monthGrowthPercent}%
          </strong>
          <span>Month growth</span>
        </article>
        <article>
          <strong>{formatCount(participation.stats.thisMonth)}</strong>
          <span>This month</span>
        </article>
      </section>

      <div className="cp-participation-grid">
        <section className="card cp-participation-panel">
          <h2>Community statistics</h2>
          <dl className="cp-participation-dl">
            <dt>This month</dt>
            <dd>{formatCount(participation.stats.thisMonth)} verified</dd>
            <dt>Last month</dt>
            <dd>{formatCount(participation.stats.lastMonth)} verified</dd>
            <dt>Learner submissions</dt>
            <dd>{formatCount(participation.stats.learnerSubmissions)}</dd>
            <dt>Community submissions</dt>
            <dd>{formatCount(participation.stats.communitySubmissions)}</dd>
            <dt>District average</dt>
            <dd>{formatCount(participation.stats.districtAvgSubmissions)} per org</dd>
          </dl>
        </section>

        <section className="card cp-participation-panel">
          <h2>Activity by weekday</h2>
          <div className="cp-chart cp-chart--weekday">
            {participation.weekdayActivity.map((d) => (
              <div key={d.day} className="cp-chart-col" title={String(d.count)}>
                <span style={{ height: `${Math.round((d.count / maxWeekday) * 100)}%` }} />
                <em>{d.day}</em>
              </div>
            ))}
          </div>
        </section>

        <section className="card cp-participation-panel cp-participation-panel--wide">
          <h2>Community champions</h2>
          {participation.supporters.length > 0 ? (
            <div className="cp-participation-supporters">
              {participation.supporters.map((s) => (
                <article key={s.name} className="cp-participation-supporter">
                  <div>
                    <strong>{s.name}</strong>
                    <span>{s.type}</span>
                  </div>
                  <div className="cp-participation-supporter-stats">
                    <strong>{formatCount(s.submissions)}</strong>
                    <span>{s.sharePercent}% of total</span>
                  </div>
                  <div className="cp-progress">
                    <span style={{ width: `${s.sharePercent}%` }} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="cp-muted">No participation yet — use the share kit to activate your network.</p>
          )}
        </section>

        <section className="card cp-participation-panel">
          <h2>
            <Share2 size={16} /> Quick share
          </h2>
          <p className="cp-muted">Organisation code: {shareKit.organisationCode}</p>
          <button
            type="button"
            className="cp-participation-copy"
            onClick={() => void copyText(shareKit.organisationCode, "code")}
          >
            {copied === "code" ? "Copied" : "Copy code"}
          </button>
          <Link href={"/community/dashboard/share" as Route} className="ds-btn ds-btn-secondary ds-btn-sm">
            Full share kit →
          </Link>
        </section>

        {participation.linkedOrganisations.length > 0 ? (
          <section className="card cp-participation-panel">
            <h2>Partner organisations</h2>
            <ul className="cp-participation-orgs">
              {participation.linkedOrganisations.map((org) => (
                <li key={org.id}>
                  <strong>{org.name}</strong>
                  <span>{org.organizationLabel}</span>
                  <em>{formatCount(org.verifiedSubmissions)} verified</em>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
