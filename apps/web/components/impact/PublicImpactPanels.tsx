"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { PublicImpactDashboard } from "../../lib/platformImpact";
import { formatCount } from "../../lib/formatCount";
import { CHART_COLORS } from "../analytics/charts/chartTheme";

function formatKpiValue(value: number, format: "count" | "percent"): string {
  if (format === "percent") return `${value}%`;
  return formatCount(value);
}

const VELOCITY_STATUS_CLASS: Record<string, string> = {
  normal: "impact-velocity--normal",
  elevated: "impact-velocity--elevated",
  high: "impact-velocity--high"
};

export function PublicImpactPanels({ data }: { data: PublicImpactDashboard }): JSX.Element {
  const infraChart = data.infrastructure.categories
    .filter((c) => c.progressPercent > 0 || c.schoolsCount > 0)
    .map((c) => ({
      name: c.category.length > 14 ? `${c.category.slice(0, 12)}…` : c.category,
      progress: c.progressPercent,
      schools: c.schoolsCount
    }));

  const phaseChart = data.infrastructure.phaseMaturity.filter((p) => p.schools > 0);
  const provinceChart = data.provinces.filter((p) => p.verifiedParticipations > 0).slice(0, 9);
  const funnelChart = data.ecosystemFunnel.filter((f) => f.count > 0);

  const fg = data.fraudGovernance;

  return (
    <div className="impact-dashboard">
      <div className="impact-kpi-grid">
        {data.kpis.map((kpi) => (
          <div key={kpi.key} className="impact-kpi-card">
            <span className="impact-kpi-value">{formatKpiValue(kpi.value, kpi.format)}</span>
            <p className="impact-kpi-label">{kpi.label}</p>
            {kpi.hint ? <p className="impact-kpi-hint">{kpi.hint}</p> : null}
          </div>
        ))}
      </div>

      <section className="impact-section">
        <h2 className="impact-section-title">Fraud &amp; participation governance</h2>
        <p className="impact-section-sub">{fg.statusLabel}</p>
        <div
          className={`impact-velocity-banner ${VELOCITY_STATUS_CLASS[fg.status] ?? ""}`}
          role="status"
        >
          <span className="impact-velocity-status">Status: {fg.status}</span>
          <span>
            {formatCount(fg.submissionsLastHour)} verified in the last hour · ratio {fg.velocityRatio}× vs 7-day
            average ({fg.avgVerifiedPerHour7d}/hr)
          </span>
        </div>
        <div className="impact-fraud-stats">
          <div className="impact-fraud-stat">
            <strong>{fg.fraudCleanRatePercent}%</strong>
            <span>Fraud-clean rate</span>
          </div>
          <div className="impact-fraud-stat">
            <strong>{formatCount(fg.openFraudFlags)}</strong>
            <span>Open fraud flags</span>
          </div>
          <div className="impact-fraud-stat">
            <strong>{formatCount(fg.flaggedOrRejectedLast24h)}</strong>
            <span>Flagged / rejected (24h)</span>
          </div>
          <div className="impact-fraud-stat">
            <strong>{formatCount(fg.duplicateAttemptsLast24h)}</strong>
            <span>Duplicate attempts (24h)</span>
          </div>
          <div className="impact-fraud-stat">
            <strong>{formatCount(fg.provincesUnderReview)}</strong>
            <span>Provinces under enhanced review</span>
          </div>
        </div>
      </section>

      {infraChart.length > 0 ? (
        <section className="impact-section">
          <h2 className="impact-section-title">Infrastructure progress by category</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={infraChart} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2eaf5" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-16} textAnchor="end" height={52} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, name) => [name === "progress" ? `${v}%` : v, name === "progress" ? "Progress" : "Schools"]} />
              <Bar dataKey="progress" name="Progress" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      ) : null}

      {phaseChart.length > 0 ? (
        <section className="impact-section">
          <h2 className="impact-section-title">School development phase maturity</h2>
          <p className="impact-section-sub">
            National development score (aggregate): {data.infrastructure.averageNationalScore}/100
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={phaseChart} margin={{ top: 8, right: 8, left: 0, bottom: 56 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2eaf5" />
              <XAxis
                dataKey="title"
                tick={{ fontSize: 9 }}
                interval={0}
                angle={-22}
                textAnchor="end"
                height={64}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="schools" name="Schools" radius={[4, 4, 0, 0]}>
                {phaseChart.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS.blue} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
      ) : null}

      {provinceChart.length > 0 ? (
        <section className="impact-section">
          <h2 className="impact-section-title">Provincial verified participation</h2>
          <div className="impact-province-bars">
            {provinceChart.map((p) => (
              <div key={p.code} className="impact-province-row">
                <span className="impact-province-name">{p.name}</span>
                <div className="impact-province-bar-track" aria-hidden="true">
                  <div className="impact-province-bar-fill" style={{ width: `${p.intensity}%` }} />
                </div>
                <span className="impact-province-count">{formatCount(p.verifiedParticipations)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {funnelChart.length > 0 ? (
        <section className="impact-section">
          <h2 className="impact-section-title">Ecosystem transformation funnel</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={funnelChart} layout="vertical" margin={{ top: 8, right: 16, left: 80, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2eaf5" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 10 }} width={76} />
              <Tooltip />
              <Bar dataKey="count" name="Count" fill={CHART_COLORS.orange} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      ) : null}

      <section className="impact-section impact-governance">
        <h2 className="impact-section-title">Governance &amp; methodology</h2>
        <ul className="impact-governance-list">
          {data.governanceNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <p className="impact-updated">Last updated: {new Date(data.updatedAt).toLocaleString("en-ZA")}</p>
      </section>
    </div>
  );
}
