"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { Users, MessageCircle, Share2, Building2 } from "lucide-react";
import { formatCount } from "../../../lib/formatCount";
import { useSchoolPortal } from "../SchoolPortalContext";

export function SchoolCommunityHubPage(): JSX.Element {
  const { school, organization, communityHub, whatsapp } = useSchoolPortal();
  const [copied, setCopied] = useState<string | null>(null);
  const maxWeekday = Math.max(...communityHub.weekdayActivity.map((d) => d.count), 1);

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
    <div className="sp-page sp-community-page">
      <header className="sp-community-hero">
        <div>
          <p className="ds-eyebrow">Community Hub</p>
          <h1>{organization.label} community</h1>
          <p className="sp-muted">
            Participation, belonging, and recognition — see who drives your {school.district} impact and how to grow
            momentum.
          </p>
        </div>
        <div className="sp-community-score">
          <strong>{communityHub.engagementScore}%</strong>
          <span>Engagement score</span>
        </div>
      </header>

      <section className="sp-community-kpi">
        <article>
          <Users size={18} />
          <strong>{formatCount(communityHub.stats.uniqueParticipants)}</strong>
          <span>Unique participants</span>
        </article>
        <article>
          <strong>{communityHub.stats.totalAreas}</strong>
          <span>Community segments</span>
        </article>
        <article>
          <strong>{communityHub.stats.learnerSharePercent}%</strong>
          <span>Learner share</span>
        </article>
        <article>
          <strong>
            {communityHub.stats.districtRank ? `#${communityHub.stats.districtRank}` : "—"}
          </strong>
          <span>District rank (month)</span>
        </article>
        <article>
          <strong>{communityHub.stats.monthGrowthPercent >= 0 ? "+" : ""}{communityHub.stats.monthGrowthPercent}%</strong>
          <span>Month growth</span>
        </article>
        <article>
          <strong>{communityHub.stats.submissionsPerLearner}</strong>
          <span>Codes per learner</span>
        </article>
      </section>

      <div className="sp-community-grid">
        <section className="card sp-community-panel">
          <h2>Community statistics</h2>
          <dl className="sp-community-dl">
            <dt>This month</dt>
            <dd>{formatCount(communityHub.stats.thisMonth)} verified</dd>
            <dt>Last month</dt>
            <dd>{formatCount(communityHub.stats.lastMonth)} verified</dd>
            <dt>Learner submissions</dt>
            <dd>{formatCount(communityHub.stats.learnerSubmissions)}</dd>
            <dt>Community submissions</dt>
            <dd>{formatCount(communityHub.stats.communitySubmissions)}</dd>
            <dt>District average (month)</dt>
            <dd>{formatCount(communityHub.stats.districtAvgSubmissions)} per school</dd>
          </dl>
        </section>

        <section className="card sp-community-panel">
          <h2>Activity by weekday</h2>
          <div className="sp-chart sp-chart--weekday">
            {communityHub.weekdayActivity.map((d) => (
              <div key={d.day} className="sp-chart-col" title={String(d.count)}>
                <span style={{ height: `${Math.round((d.count / maxWeekday) * 100)}%` }} />
                <em>{d.day}</em>
              </div>
            ))}
          </div>
        </section>

        <section className="card sp-community-panel sp-community-panel--wide">
          <h2>Community champions</h2>
          {communityHub.supporters.length > 0 ? (
            <div className="sp-community-supporters">
              {communityHub.supporters.map((s) => (
                <article key={s.name} className="sp-community-supporter">
                  <div>
                    <strong>{s.name}</strong>
                    <span>{s.type}</span>
                  </div>
                  <div className="sp-community-supporter-stats">
                    <strong>{formatCount(s.submissions)}</strong>
                    <span>{s.sharePercent}% of total</span>
                  </div>
                  <div className="sp-progress">
                    <span style={{ width: `${s.sharePercent}%` }} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="sp-muted">No participation yet — use the share kit below to activate your community.</p>
          )}
        </section>

        <section className="card sp-community-panel">
          <h2>
            <Share2 size={16} /> Share kit
          </h2>
          <p className="sp-muted">Copy-ready messages for WhatsApp groups and community meetings.</p>
          <p>
            <strong>School code:</strong> {communityHub.shareKit.schoolCode}
            <button
              type="button"
              className="sp-community-copy"
              onClick={() => void copyText(communityHub.shareKit.schoolCode, "code")}
            >
              {copied === "code" ? "Copied" : "Copy"}
            </button>
          </p>
          <p>
            <strong>WhatsApp:</strong> {communityHub.shareKit.whatsappPhone}
          </p>
          <ul className="sp-community-templates">
            {communityHub.shareKit.messageTemplates.map((msg, i) => (
              <li key={i}>
                <p>{msg}</p>
                <button
                  type="button"
                  className="sp-community-copy"
                  onClick={() => void copyText(msg, `t${i}`)}
                >
                  {copied === `t${i}` ? "Copied" : "Copy message"}
                </button>
              </li>
            ))}
          </ul>
          <a
            href={`https://wa.me/${communityHub.shareKit.whatsappPhone.replace(/\D/g, "")}`}
            className="ds-btn ds-btn-primary ds-btn-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={14} /> Open WhatsApp
          </a>
        </section>

        <section className="card sp-community-panel">
          <h2>
            <Building2 size={16} /> Linked organisations
          </h2>
          <p className="sp-muted">NGOs, community groups, and faith partners in {school.district}.</p>
          {communityHub.linkedOrganisations.length > 0 ? (
            <ul className="sp-community-orgs">
              {communityHub.linkedOrganisations.map((org) => (
                <li key={org.id}>
                  <div>
                    <strong>{org.name}</strong>
                    <span>{org.organizationLabel}</span>
                  </div>
                  <span>{formatCount(org.verifiedSubmissions)} verified</span>
                  {org.profileUrl ? (
                    <Link href={org.profileUrl as Route}>Profile →</Link>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="sp-muted">No linked organisations in your district yet.</p>
          )}
        </section>

        {communityHub.recommendations.length > 0 ? (
          <section className="card sp-community-panel sp-community-panel--wide">
            <h2>Grow your community</h2>
            <ul className="sp-success-recs">
              {communityHub.recommendations.map((rec) => (
                <li key={rec.id} className={`sp-success-rec sp-success-rec--${rec.priority}`}>
                  <p>{rec.message}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <p className="sp-muted sp-community-foot">
        WhatsApp commands for your community: {whatsapp.commands.join(" · ")}
      </p>
    </div>
  );
}
