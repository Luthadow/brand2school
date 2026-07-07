"use client";

import { useMemo, useState } from "react";
import { formatCount } from "../../../lib/formatCount";
import { useSchoolPortal } from "../SchoolPortalContext";

type Period = "today" | "week" | "month" | "all";
type Scope = "national" | "province" | "district";

const PERIOD_LABEL: Record<Period, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
  all: "All time"
};

const SCOPE_LABEL: Record<Scope, string> = {
  national: "National",
  province: "Province",
  district: "District"
};

const TIER_CLASS: Record<string, string> = {
  bronze: "sp-badge-tier--bronze",
  silver: "sp-badge-tier--silver",
  gold: "sp-badge-tier--gold",
  platinum: "sp-badge-tier--platinum"
};

export function SchoolLeaderboardsPage(): JSX.Element {
  const { school, leaderboards, badges } = useSchoolPortal();
  const [period, setPeriod] = useState<Period>(leaderboards.defaultPeriod);
  const [scope, setScope] = useState<Scope>("national");

  const boardKey = `${scope}-${period}` as keyof typeof leaderboards.boards;
  const board = leaderboards.boards[boardKey];

  const inProgress = useMemo(
    () => badges.badges.filter((b) => !b.earned && b.progressPercent > 0).slice(0, 6),
    [badges.badges]
  );

  return (
    <div className="sp-page sp-lb-page">
      <header className="sp-page-head">
        <p className="ds-eyebrow">Competition layer</p>
        <h1>Leaderboards &amp; achievements</h1>
        <p className="sp-muted">
          Climb national, provincial, and district rankings. Earn badges that brands see when evaluating school partners.
        </p>
      </header>

      <section className="sp-lb-hero card">
        <div>
          <span className={`sp-lb-level sp-lb-level--${badges.level}`}>Level: {badges.levelLabel}</span>
          <p className="sp-muted">
            {badges.earnedCount} of {badges.totalCount} badges earned · {school.district}, {school.province}
          </p>
        </div>
        <div className="sp-lb-your-rank">
          <strong>{board?.yourRank ? `#${board.yourRank}` : "—"}</strong>
          <span>
            {SCOPE_LABEL[scope]} · {PERIOD_LABEL[period]}
          </span>
          <em>{formatCount(board?.yourSubmissions ?? 0)} verified</em>
        </div>
      </section>

      <div className="sp-lb-filters">
        <div className="sp-lb-tabs" role="tablist" aria-label="Leaderboard scope">
          {leaderboards.scopes.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={scope === s}
              className={`sp-lb-tab${scope === s ? " sp-lb-tab--active" : ""}`}
              onClick={() => setScope(s)}
            >
              {SCOPE_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="sp-lb-tabs sp-lb-tabs--period" role="tablist" aria-label="Leaderboard period">
          {leaderboards.periods.map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={period === p}
              className={`sp-lb-tab${period === p ? " sp-lb-tab--active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      <section className="sp-lb-board card">
        <header className="sp-lb-board-head">
          <h2>
            {board?.scopeLabel ?? SCOPE_LABEL[scope]} — {PERIOD_LABEL[period]}
          </h2>
          <span className="sp-muted">{board?.schoolsRanked ?? 0} schools ranked</span>
        </header>

        {board && board.entries.length > 0 ? (
          <ol className="sp-lb-list">
            {board.entries.map((entry) => (
              <li
                key={`${entry.schoolId}-${entry.rank}`}
                className={`sp-lb-row${entry.isCurrentSchool ? " sp-lb-row--you" : ""}`}
              >
                <span className="sp-lb-rank">#{entry.rank}</span>
                <div className="sp-lb-school">
                  <strong>{entry.schoolName}</strong>
                  <span>
                    {entry.district}, {entry.province}
                  </span>
                </div>
                <span className="sp-lb-score">{formatCount(entry.submissions)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="sp-muted sp-lb-empty">
            No rankings yet for this period — share your school code on WhatsApp to start climbing.
          </p>
        )}
      </section>

      <div className="sp-lb-grid">
        <section className="card sp-lb-badges">
          <h2>Earned badges</h2>
          {badges.featured.length > 0 ? (
            <ul className="sp-lb-badge-grid">
              {badges.featured.map((badge) => (
                <li key={badge.id} className={`sp-lb-badge ${TIER_CLASS[badge.tier] ?? ""}`}>
                  <strong>{badge.label}</strong>
                  <p>{badge.description}</p>
                  <span className="sp-lb-badge-tier">{badge.tier}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="sp-muted">Submit your first verified code to unlock participation badges.</p>
          )}
        </section>

        <section className="card sp-lb-badges">
          <h2>Next badges</h2>
          {inProgress.length > 0 ? (
            <ul className="sp-lb-next-list">
              {inProgress.map((badge) => (
                <li key={badge.id}>
                  <div className="sp-lb-next-head">
                    <strong>{badge.label}</strong>
                    <span>{badge.progressPercent}%</span>
                  </div>
                  <p className="sp-muted">{badge.description}</p>
                  <div className="sp-progress">
                    <span style={{ width: `${badge.progressPercent}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="sp-muted">You are on track — keep participating to unlock more achievements.</p>
          )}
        </section>
      </div>

      <section className="card sp-lb-all-badges">
        <h2>All achievements ({badges.earnedCount}/{badges.totalCount})</h2>
        <ul className="sp-lb-all-grid">
          {badges.badges.map((badge) => (
            <li
              key={badge.id}
              className={`sp-lb-all-item${badge.earned ? " sp-lb-all-item--earned" : ""}`}
            >
              <span className={`sp-lb-all-tier ${TIER_CLASS[badge.tier] ?? ""}`}>{badge.tier}</span>
              <div>
                <strong>{badge.label}</strong>
                <p>{badge.description}</p>
              </div>
              {badge.earned ? (
                <span className="sp-lb-earned-mark">Earned</span>
              ) : (
                <span className="sp-lb-progress-pct">{badge.progressPercent}%</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
