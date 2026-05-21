"use client";

import Link from "next/link";
import type { Route } from "next";
import { Award, Heart, Map, School, Target, TrendingUp, Users } from "lucide-react";
import { formatCount } from "../../lib/formatCount";
import { formatZar } from "../../lib/schoolPortal";
import { useSchoolPortal } from "./SchoolPortalContext";

export function SchoolOverview(): JSX.Element {
  const portal = useSchoolPortal();
  const { school, overview, targets, gamification, notifications, development } = portal;

  const stats = [
    { label: "Verified submissions", value: overview.verifiedSubmissions, icon: TrendingUp },
    { label: "Development progress", value: `${development.overallProgressPercent}%`, icon: Map },
    { label: "Active phase", value: `Phase ${development.currentPhase}`, icon: Target },
    { label: "Tier", value: development.tierLabel, icon: Award },
    { label: "Learners", value: school.learnerCount, icon: Users },
    { label: "Impact value", value: formatZar(overview.estimatedImpactZar), icon: Heart }
  ];

  const activePhase = development.phases.find((p) => p.status === "active");

  return (
    <div className="sp-page">
      <header className="sp-hero">
        <div>
          <p className="ds-eyebrow">National Educational Development Network</p>
          <h1>{school.name}</h1>
          <p className="sp-muted">
            Building the future of South African education — not one-off relief, continuous growth.
          </p>
          <p className="sp-muted">
            {school.district}, {school.province} · Tier {development.tier}: {development.tierLabel}
          </p>
        </div>
        <div className={`sp-badge sp-badge--${gamification.level}`}>
          <span>{gamification.level === "gold" ? "🥇" : gamification.level === "silver" ? "🥈" : "🥉"}</span>
          <strong>{gamification.label}</strong>
        </div>
      </header>

      {development.phaseTransition ? (
        <section className="sp-phase-banner">
          <strong>{development.phaseTransition.completed}</strong>
          <span>→ {development.phaseTransition.opened}</span>
        </section>
      ) : null}

      <div className="sp-stat-grid">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <article key={s.label} className="sp-stat">
              <Icon size={20} />
              <strong>{typeof s.value === "number" ? formatCount(s.value) : s.value}</strong>
              <span>{s.label}</span>
            </article>
          );
        })}
      </div>

      <section className="sp-section">
        <div className="sp-section-head-row">
          <h2>Development score</h2>
          <Link href={"/school/dashboard/roadmap" as Route} className="ds-btn ds-btn-secondary ds-btn-sm">
            Full roadmap
          </Link>
        </div>
        <div className="sp-score-grid">
          {development.areaScores.slice(0, 6).map((a) => (
            <article key={a.area} className="sp-score-mini">
              <span>{a.area}</span>
              <strong>{a.percent}%</strong>
              <div className="sp-progress sp-progress--inline">
                <span style={{ width: `${a.percent}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      {activePhase ? (
        <section className="sp-section">
          <h2>
            Active: Phase {activePhase.phase} — {activePhase.title}
          </h2>
          <p className="sp-muted">{activePhase.focus}</p>
          <div className="sp-progress sp-progress--lg">
            <span style={{ width: `${activePhase.progressPercent}%` }} />
          </div>
          <p className="sp-muted">{activePhase.progressPercent}% of phase complete · progress is never lost</p>
        </section>
      ) : null}

      {targets.length > 0 ? (
        <section className="sp-section">
          <h2>Live community targets</h2>
          {targets.slice(0, 2).map((t) => (
            <article key={t.id} className="sp-target-card">
              <div className="sp-target-head">
                <div>
                  <h3>{t.name}</h3>
                  <p className="sp-muted">{t.brandName}</p>
                </div>
                <strong>{t.percentToTarget}%</strong>
              </div>
              <div className="sp-progress">
                <span style={{ width: `${t.percentToTarget}%` }} />
              </div>
            </article>
          ))}
        </section>
      ) : null}

      <section className="sp-section">
        <h2>Updates</h2>
        <ul className="sp-notify-list">
          {notifications.slice(0, 3).map((n) => (
            <li key={n.id} className={n.read ? "" : "sp-notify--new"}>
              <strong>{n.title}</strong>
              <p>{n.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
