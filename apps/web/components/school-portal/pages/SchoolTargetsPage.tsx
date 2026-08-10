"use client";

import { useSchoolPortal } from "../SchoolPortalContext";
import { formatCount } from "../../../lib/formatCount";

export function SchoolTargetsPage(): JSX.Element {
  const { targets } = useSchoolPortal();

  return (
    <div className="sp-page">
      <header className="sp-page-head">
        <p className="ds-eyebrow">Live target tracking</p>
        <h1>Campaign progress</h1>
        <p className="sp-muted">We are moving closer every day.</p>
      </header>
      {targets.map((t) => (
        <article key={t.id} className="sp-target-card sp-target-card--lg">
          <h3>{t.name}</h3>
          <p className="sp-muted">{t.brandName}</p>
          <div className="sp-progress sp-progress--lg">
            <span style={{ width: `${t.percentToTarget}%` }} />
          </div>
          <div className="sp-target-stats">
            <div>
              <strong>{formatCount(t.validSubmissions)}</strong>
              <span>verified</span>
            </div>
            <div>
              <strong>
                R{(t.schoolSupportGeneratedZar ?? 0).toLocaleString("en-ZA", { maximumFractionDigits: 2 })}
              </strong>
              <span>support generated</span>
            </div>
            <div>
              <strong>{t.percentToTarget}%</strong>
              <span>complete</span>
            </div>
            <div>
              <strong>{formatCount(t.remainingToTarget)}</strong>
              <span>remaining</span>
            </div>
          </div>
          {t.contributionPerCodeZar != null ? (
            <p className="sp-muted">
              {formatCount(t.validSubmissions)} verified codes × R{t.contributionPerCodeZar}
            </p>
          ) : null}
          {t.infrastructureGoal ? <p className="sp-goal">Unlocking: {t.infrastructureGoal}</p> : null}
        </article>
      ))}
    </div>
  );
}
