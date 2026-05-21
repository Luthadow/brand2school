"use client";

import Link from "next/link";
import { CheckCircle2, Lock, Sparkles } from "lucide-react";
import { useSchoolPortal } from "./SchoolPortalContext";

export function SchoolRoadmapPage(): JSX.Element {
  const { development, funding, overview, brandPartners, annualCycles } = useSchoolPortal();
  const { phases, areaScores, tierLabel, tierDescription, infrastructure } = development;
  const activeInfra = infrastructure.phases.find((p) => p.phase === development.currentPhase);

  return (
    <div className="sp-page">
      <header className="sp-page-head">
        <p className="ds-eyebrow">Continuous development</p>
        <h1>Development roadmap</h1>
        <p className="sp-muted">{development.missionStatement}</p>
      </header>

      {development.phaseTransition ? (
        <section className="sp-phase-banner">
          <CheckCircle2 size={22} />
          <div>
            <strong>{development.phaseTransition.completed}</strong>
            <span>→ {development.phaseTransition.opened}</span>
          </div>
        </section>
      ) : null}

      <article className="sp-tier-card">
        <Sparkles size={20} />
        <div>
          <strong>
            Tier {development.tier}: {tierLabel}
          </strong>
          <p className="sp-muted">{tierDescription}</p>
          <p className="sp-muted">
            National school score: {overview.nationalScore}% · Funding balance: R
            {overview.fundingBalanceZar.toLocaleString("en-ZA")}
          </p>
        </div>
      </article>

      <section className="sp-section">
        <h2>Funding conversion</h2>
        <p className="sp-muted">{funding.message}</p>
        <p className="sp-muted">
          R{funding.contributionPerCodeZar} per verified code ·{" "}
          {Math.round(funding.fundSplit.schoolInfrastructure * 100)}% to school infrastructure ·{" "}
          {Math.round(funding.fundSplit.operations * 100)}% operations ·{" "}
          {Math.round(funding.fundSplit.verificationAudits * 100)}% verification ·{" "}
          {Math.round(funding.fundSplit.growthReserve * 100)}% growth reserve
        </p>
      </section>

      {activeInfra ? (
        <section className="sp-section">
          <h2>
            Phase {activeInfra.phase} infrastructure — verified progress {activeInfra.verifiedProgressPercent}%
          </h2>
          <p className="sp-muted">
            Phases unlock at {development.phaseCompletionThreshold}% verified completion (not promises).
          </p>
          <div className="sp-score-table-wrap">
            <table className="sp-score-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Needed</th>
                  <th>Current</th>
                  <th>Done</th>
                  <th>Verified</th>
                </tr>
              </thead>
              <tbody>
                {activeInfra.items.map((row) => (
                  <tr key={row.category}>
                    <td>{row.category}</td>
                    <td>{row.needed}</td>
                    <td>{row.current}</td>
                    <td>{row.completionPercent}%</td>
                    <td>{row.verificationStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="sp-section">
        <h2>Phased development</h2>
        <p className="sp-muted">Progress is retained — schools never restart from zero.</p>
        <ol className="sp-phase-list">
          {phases.map((p) => (
            <li key={p.phase} className={`sp-phase-item sp-phase-item--${p.status}`}>
              <div className="sp-phase-item-head">
                <span className="sp-phase-num" aria-hidden>
                  {p.status === "completed" ? "✅" : p.status === "active" ? "➡" : "🔒"}
                </span>
                <div className="sp-phase-item-title">
                  <h3>
                    Phase {p.phase}: {p.title}
                  </h3>
                  <p className="sp-muted">{p.focus}</p>
                </div>
                <strong>{p.progressPercent}%</strong>
              </div>
              <div className="sp-progress">
                <span style={{ width: `${p.progressPercent}%` }} />
              </div>
              <p className="sp-phase-items">{p.items.join(" · ")}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="sp-section">
        <h2>Development score</h2>
        <div className="sp-score-table-wrap">
          <table className="sp-score-table">
            <thead>
              <tr>
                <th>Area</th>
                <th>%</th>
                <th>Bar</th>
              </tr>
            </thead>
            <tbody>
              {areaScores.map((row) => (
                <tr key={row.area}>
                  <td>{row.area}</td>
                  <td>{row.percent}%</td>
                  <td>
                    <div className="sp-progress sp-progress--inline">
                      <span style={{ width: `${row.percent}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sp-section">
        <h2>Annual national cycles</h2>
        <ul className="sp-cycle-list">
          {annualCycles.map((c) => (
            <li
              key={c.year}
              className={c.year === development.annualCycle.year ? "sp-cycle--current" : ""}
            >
              <strong>{c.year}</strong>
              <span>{c.focus}</span>
              {c.year === development.annualCycle.year ? <em>Current</em> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-section">
        <h2>Brand category partners</h2>
        <ul className="sp-partner-list">
          {brandPartners.map((b) => (
            <li key={b.brand}>
              <strong>{b.brand}</strong>
              <span>{b.categories.join(" · ")}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-section">
        <h2>Active goals</h2>
        <ul className="sp-goals-list">
          {development.activeGoals.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
        <Link href="/school/dashboard/targets" className="ds-btn ds-btn-primary">
          View live targets
        </Link>
      </section>
    </div>
  );
}
