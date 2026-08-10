"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  CheckCircle2,
  Circle,
  Clock,
  Lightbulb,
  MapPin,
  Briefcase,
  Target,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  Rocket
} from "lucide-react";
import { formatCount } from "../../lib/formatCount";
import { formatZar } from "../../lib/schoolPortal";
import { useSchoolPortal } from "./SchoolPortalContext";

const REC_ACTIONS: Record<string, Route> = {
  "complete-verification": "/school/dashboard/documents",
  "upload-logo": "/school/dashboard/profile",
  "join-campaign": "/school/dashboard/targets",
  "boost-campaign": "/school/dashboard/targets",
  "needs-assessment": "/school/dashboard/needs",
  "first-submission": "/school/dashboard/submissions",
  "climb-leaderboard": "/school/dashboard/leaderboards" as Route,
  "grow-community": "/school/dashboard/community" as Route,
  "register-volunteers": "/school/dashboard/people" as Route,
  "schedule-event": "/school/dashboard/people" as Route,
  "grow-alumni": "/school/dashboard/enterprise" as Route,
  "launch-venture": "/school/dashboard/enterprise" as Route,
  "use-school-crm": "/school/dashboard/crm" as Route,
  "crm-overdue": "/school/dashboard/crm" as Route
};

function statusIcon(status: "complete" | "pending" | "missing"): JSX.Element {
  if (status === "complete") return <CheckCircle2 size={16} className="sp-success-check" />;
  if (status === "pending") return <Clock size={16} className="sp-success-pending" />;
  return <Circle size={16} className="sp-success-missing" />;
}

export function SchoolOverview(): JSX.Element {
  const portal = useSchoolPortal();
  const { school, overview, targets, gamification, verification, successCentre, development, badges } = portal;
  const { verificationScore, successScore, recommendations, participation, impactTimeline } = successCentre;

  return (
    <div className="sp-page">
      <header className="sp-success-hero">
        <div>
          <p className="ds-eyebrow">School Success Centre</p>
          <h1>{school.name}</h1>
          <p className="sp-muted">
            {school.district}, {school.province} · Your success drives brand ROI — participation, verification, and
            community visibility in one place.
          </p>
        </div>
        <div className="sp-success-scores">
          <div className="sp-success-ring">
            <strong>{successScore.percent}%</strong>
            <span>Success score</span>
          </div>
          <div className="sp-success-ring sp-success-ring--verify">
            <strong>{verificationScore.percent}%</strong>
            <span>Verification</span>
          </div>
        </div>
      </header>

      <section className="sp-success-kpi-strip">
        <article className="sp-success-kpi">
          <TrendingUp size={18} />
          <strong>{formatCount(participation.today)}</strong>
          <span>Today</span>
        </article>
        <article className="sp-success-kpi">
          <TrendingUp size={18} />
          <strong>{formatCount(participation.thisWeek)}</strong>
          <span>This week</span>
        </article>
        <article className="sp-success-kpi">
          <TrendingUp size={18} />
          <strong>{formatCount(participation.thisMonth)}</strong>
          <span>This month</span>
        </article>
        <article className="sp-success-kpi">
          <Trophy size={18} />
          <strong>{participation.nationalRank ? `#${participation.nationalRank}` : "—"}</strong>
          <span>National rank</span>
        </article>
        <article className="sp-success-kpi">
          <MapPin size={18} />
          <strong>{participation.districtRank ? `#${participation.districtRank}` : "—"}</strong>
          <span>District rank</span>
        </article>
        <article className="sp-success-kpi">
          <Users size={18} />
          <strong>{formatCount(portal.communityHub.stats.uniqueParticipants)}</strong>
          <span>Community participants</span>
        </article>
        <article className="sp-success-kpi">
          <UserCheck size={18} />
          <strong>{portal.peopleHub.summary.activeVolunteers}</strong>
          <span>Active volunteers</span>
        </article>
        <article className="sp-success-kpi">
          <Rocket size={18} />
          <strong>{portal.enterpriseHub.summary.activeVentures}</strong>
          <span>Student ventures</span>
        </article>
        <article className="sp-success-kpi">
          <Briefcase size={18} />
          <strong>{portal.crmHub.summary.openTasks}</strong>
          <span>Open CRM tasks</span>
        </article>
      </section>

      <section className="sp-success-grid">
        <article className="card sp-success-panel">
          <h2>Verification score</h2>
          <p className="sp-muted">Reach 100% to unlock full brand visibility and trust.</p>
          <ul className="sp-success-checklist">
            {verificationScore.items.map((item) => (
              <li key={item.key} className={`sp-success-checklist--${item.status}`}>
                {statusIcon(item.status)}
                <span>{item.label}</span>
                <span className="sp-success-checklist-status">
                  {item.status === "complete" ? "Done" : item.status === "pending" ? "Pending" : "Missing"}
                </span>
              </li>
            ))}
          </ul>
          {verificationScore.percent < 100 ? (
            <Link href="/school/dashboard/documents" className="ds-btn ds-btn-secondary ds-btn-sm">
              Complete verification
            </Link>
          ) : (
            <span className="sp-chip sp-chip--gold">Verified partner ready</span>
          )}
        </article>

        <article className="card sp-success-panel">
          <h2>
            <Lightbulb size={18} /> Smart recommendations
          </h2>
          <ul className="sp-success-recs">
            {recommendations.map((rec) => (
              <li key={rec.id} className={`sp-success-rec sp-success-rec--${rec.priority}`}>
                <p>{rec.message}</p>
                {rec.actionLabel && REC_ACTIONS[rec.id] ? (
                  <Link href={REC_ACTIONS[rec.id]} className="sp-success-rec-link">
                    {rec.actionLabel} →
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </article>

        <article className="card sp-success-panel">
          <h2>Brand2School success score</h2>
          <p className="sp-muted">Your reputation with brands and sponsors.</p>
          <ul className="sp-success-dimensions">
            {successScore.dimensions.map((d) => (
              <li key={d.key}>
                <span>{d.label}</span>
                <div className="sp-progress sp-progress--inline">
                  <span style={{ width: `${d.score}%` }} />
                </div>
                <strong>{d.score}%</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="card sp-success-panel">
          <h2>
            <Trophy size={18} /> Impact badges
          </h2>
          <div className="sp-badges">
            {badges.featured.map((b) => (
              <span key={b.id} className={`sp-chip sp-chip--${b.tier}`}>
                {b.label}
              </span>
            ))}
            <span className={`sp-chip sp-chip--${gamification.level}`}>{gamification.label}</span>
          </div>
          <p className="sp-muted">
            {badges.earnedCount}/{badges.totalCount} achievements · Impact {formatZar(overview.estimatedImpactZar)} ·
            Phase {development.currentPhase}
          </p>
          <Link href={"/school/dashboard/leaderboards" as Route} className="ds-btn ds-btn-secondary ds-btn-sm">
            View leaderboards →
          </Link>
          <Link href={"/school/dashboard/community" as Route} className="ds-btn ds-btn-secondary ds-btn-sm">
            Community Hub →
          </Link>
          <Link href={"/school/dashboard/people" as Route} className="ds-btn ds-btn-secondary ds-btn-sm">
            People & events →
          </Link>
          <Link href={"/school/dashboard/enterprise" as Route} className="ds-btn ds-btn-secondary ds-btn-sm">
            Enterprise & alumni →
          </Link>
          <Link href={"/school/dashboard/crm" as Route} className="ds-btn ds-btn-secondary ds-btn-sm">
            School CRM →
          </Link>
        </article>

        <article className="card sp-success-panel sp-success-panel--wide">
          <h2>Live campaigns</h2>
          {targets.length === 0 ? (
            <p className="sp-muted">No active campaigns yet — brands publish targets as campaigns go live.</p>
          ) : (
            <div className="sp-success-campaigns">
              {targets.slice(0, 4).map((t) => (
                <div key={t.id} className="sp-target-card">
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
                  <p className="sp-muted">
                    {formatCount(t.validSubmissions)} / {formatCount(t.targetSubmissions)} ·{" "}
                    {formatCount(t.remainingToTarget)} remaining
                  </p>
                  {t.schoolSupportGeneratedZar != null && t.contributionPerCodeZar != null ? (
                    <p className="sp-muted">
                      School Support Generated:{" "}
                      <strong>
                        R{t.schoolSupportGeneratedZar.toLocaleString("en-ZA", { maximumFractionDigits: 2 })}
                      </strong>{" "}
                      ({formatCount(t.validSubmissions)} × R{t.contributionPerCodeZar})
                    </p>
                  ) : (
                    <p className="sp-muted">~{t.estimatedCompletionMonths} mo. est.</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {participation.bestCampaign ? (
            <p className="sp-muted">Best performing: <strong>{participation.bestCampaign}</strong></p>
          ) : null}
        </article>

        <article className="card sp-success-panel sp-success-panel--wide">
          <h2>Impact timeline</h2>
          <ol className="sp-success-timeline">
            {impactTimeline.map((event) => (
              <li key={event.id}>
                <span className="sp-success-timeline-dot" />
                <div>
                  <strong>{event.title}</strong>
                  <span>{new Date(event.date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              </li>
            ))}
          </ol>
        </article>
      </section>

      {verification.status === "NOT_SUBMITTED" || verification.status === "REJECTED" ? (
        <section className="card" style={{ marginTop: "1rem", borderColor: "#4da3ff" }}>
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Get started</h2>
          <p className="sp-muted" style={{ margin: 0 }}>
            Explore the portal now. Upload documents in{" "}
            <Link href="/school/dashboard/documents">Docs</Link> — participation can begin before full approval.
          </p>
        </section>
      ) : null}
    </div>
  );
}
