"use client";

import { useSchoolPortal } from "../SchoolPortalContext";
import { formatCount } from "../../../lib/formatCount";

export function SchoolSubmissionsPage(): JSX.Element {
  const { supporters, submissionsTrend, overview } = useSchoolPortal();
  const max = Math.max(...submissionsTrend.map((t) => t.count), 1);

  return (
    <div className="sp-page">
      <header className="sp-page-head">
        <p className="ds-eyebrow">Submissions</p>
        <h1>Community participation</h1>
        <p className="sp-muted">Verified submissions, trends, and top supporters.</p>
      </header>
      <div className="sp-stat-grid sp-stat-grid--2">
        <article className="sp-stat">
          <strong>{formatCount(overview.verifiedSubmissions)}</strong>
          <span>Verified</span>
        </article>
        <article className="sp-stat">
          <strong>{overview.monthlyRank ? `#${overview.monthlyRank}` : "—"}</strong>
          <span>Monthly rank</span>
        </article>
      </div>
      <section className="sp-section">
        <h2>Weekly trend</h2>
        <div className="sp-chart">
          {submissionsTrend.map((p) => (
            <div key={p.label} className="sp-chart-col" title={String(p.count)}>
              <span style={{ height: `${Math.round((p.count / max) * 100)}%` }} />
              <em>{p.label}</em>
            </div>
          ))}
        </div>
      </section>
      <section className="sp-section">
        <h2>Top community supporters</h2>
        <ul className="sp-supporters">
          {supporters.map((s) => (
            <li key={s.name}>
              <strong>{s.name}</strong>
              <span>
                {s.type} · {formatCount(s.submissions)} submissions
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
