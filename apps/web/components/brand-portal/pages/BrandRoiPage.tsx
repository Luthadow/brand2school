"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CircleDollarSign,
  RefreshCw,
  School,
  Target,
  TrendingUp,
  Users
} from "lucide-react";
import { formatCount } from "../../../lib/formatCount";
import type { BrandRoiDashboard } from "../../../lib/brandRoi";
import { FUND_ALLOCATION_LABELS } from "../../../lib/brandRoi";
import { formatZar } from "../../../lib/brandPortal";
import { useBrandPortal } from "../BrandPortalContext";
import { BrandPageHeader } from "../BrandPageHeader";

function formatPeriod(from: string, to: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  return `${new Date(from).toLocaleDateString("en-ZA", opts)} – ${new Date(to).toLocaleDateString("en-ZA", opts)}`;
}

function Sparkline({ values }: { values: number[] }): JSX.Element {
  if (values.length === 0) return <div className="bp-roi-sparkline bp-roi-sparkline--empty" aria-hidden="true" />;
  const max = Math.max(...values, 1);
  const width = 160;
  const height = 44;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values
    .map((v, i) => `${i * step},${height - (v / max) * (height - 4) - 2}`)
    .join(" ");
  return (
    <svg className="bp-roi-sparkline" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" points={points} />
    </svg>
  );
}

export function BrandRoiPage(): JSX.Element {
  const { campaigns } = useBrandPortal();
  const [data, setData] = useState<BrandRoiDashboard | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (campaignId: string | null): Promise<void> => {
    setLoading(true);
    try {
      const qs = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : "";
      const res = await fetch(`/api/analytics/brand/roi${qs}`, { cache: "no-store" });
      if (res.ok) setData((await res.json()) as BrandRoiDashboard);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(null);
  }, [refresh]);

  function handleCampaignChange(id: string): void {
    const nextId = id === "all" ? null : id;
    setSelectedCampaignId(nextId);
    void refresh(nextId);
  }

  const participationValues = useMemo(
    () => (data?.participationTrend ?? []).slice(-8).map((p) => p.activeParticipants),
    [data]
  );

  if (!data) {
    return (
      <div className="bp-page">
        <BrandPageHeader eyebrow="ESG ROI" title="ROI intelligence" description="Loading…" />
      </div>
    );
  }

  const { summary, fundAllocation, narrative } = data;

  const heroKpis = [
    { label: "Total investment", value: formatZar(summary.totalInvestmentZar), icon: CircleDollarSign },
    { label: "Impact delivered", value: formatZar(summary.impactValueDeliveredZar), icon: TrendingUp },
    { label: "Impact efficiency", value: `${summary.impactEfficiencyPercent}%`, icon: Target },
    { label: "Cost per verified code", value: formatZar(summary.costPerVerifiedSubmissionZar), icon: CircleDollarSign },
    { label: "Cost per school", value: formatZar(summary.costPerSchoolZar), icon: School },
    { label: "Consumer reach (est.)", value: formatCount(summary.estimatedConsumerReach), icon: Users }
  ];

  const efficiencyKpis = [
    { label: "Engagement rate", value: `${summary.engagementRate}%` },
    { label: "Verification rate", value: `${summary.verificationRate}%` },
    { label: "Cost per 1k reach", value: formatZar(summary.costPerThousandReachZar) },
    { label: "Provinces active", value: String(summary.provincesReached) }
  ];

  const allocationTotal = Object.values(fundAllocation).reduce((a, b) => a + b, 0) || 1;
  const allocationRows = (Object.keys(fundAllocation) as Array<keyof typeof fundAllocation>)
    .map((key) => ({
      key,
      label: FUND_ALLOCATION_LABELS[key],
      value: fundAllocation[key],
      share: Math.round((fundAllocation[key] / allocationTotal) * 1000) / 10
    }))
    .filter((r) => r.value > 0);

  const investmentBreakdown = [
    { label: "Platform & subscription", value: summary.platformSpendZar },
    { label: "Transformation pool committed", value: summary.transformationPoolCommittedZar },
    { label: "Code micro-contributions", value: summary.codeContributionsZar }
  ].filter((r) => r.value > 0);

  return (
    <div className="bp-page">
      <BrandPageHeader
        eyebrow="ESG ROI Intelligence"
        title="Was it worth the investment?"
        description="Board-ready ROI — investment vs verified impact, cost efficiency, and ESG narrative lines for annual reports."
        actions={
          <>
            <label className="bp-inv-select-wrap">
              <span>Campaign</span>
              <select
                className="bp-inv-select"
                value={selectedCampaignId ?? "all"}
                onChange={(e) => handleCampaignChange(e.target.value)}
                disabled={loading}
              >
                <option value="all">All campaigns</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="bp-inv-btn"
              onClick={() => void refresh(selectedCampaignId)}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "ba-spin" : undefined} />
              Refresh
            </button>
          </>
        }
      />

      <section className="bp-roi-hero">
        <div>
          <p className="ds-eyebrow">Executive summary</p>
          <h2>{narrative.headline}</h2>
          <p className="bp-roi-esg-line">{narrative.esgLine}</p>
          <p className="bp-muted">{narrative.boardSummary}</p>
          <p className="bp-muted bp-roi-period">{formatPeriod(data.period.from, data.period.to)}</p>
        </div>
        <div className="bp-roi-efficiency-ring" aria-hidden="true">
          <strong>{summary.impactEfficiencyPercent}%</strong>
          <span>impact efficiency</span>
        </div>
      </section>

      <section className="bp-roi-kpi-strip" aria-label="ROI KPIs">
        {heroKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article key={kpi.label} className="bp-roi-kpi">
              <Icon size={18} />
              <strong>{kpi.value}</strong>
              <span>{kpi.label}</span>
            </article>
          );
        })}
      </section>

      <section className="bp-roi-grid">
        <article className="bp-panel bp-roi-panel">
          <h2>Investment breakdown</h2>
          {investmentBreakdown.length === 0 ? (
            <p className="bp-empty-note">Investment data appears after platform fees and pools are configured.</p>
          ) : (
            <ul className="bp-roi-breakdown">
              {investmentBreakdown.map((row) => (
                <li key={row.label}>
                  <span>{row.label}</span>
                  <strong>{formatZar(row.value)}</strong>
                </li>
              ))}
              <li className="bp-roi-breakdown--total">
                <span>Total investment</span>
                <strong>{formatZar(summary.totalInvestmentZar)}</strong>
              </li>
            </ul>
          )}
          <p className="bp-muted">
            Pool deployed: {formatZar(summary.transformationPoolDeployedZar)} · Verified:{" "}
            {formatCount(summary.verifiedSubmissions)} codes · {formatCount(summary.schoolsReached)} schools
          </p>
        </article>

        <article className="bp-panel bp-roi-panel">
          <h2>Efficiency metrics</h2>
          <ul className="bp-roi-efficiency">
            {efficiencyKpis.map((row) => (
              <li key={row.label}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </li>
            ))}
          </ul>
          <div className="bp-roi-trend">
            <span>Participation trend</span>
            <Sparkline values={participationValues} />
          </div>
        </article>

        <article className="bp-panel bp-roi-panel">
          <h2>Fund allocation</h2>
          <p className="bp-muted">How verified code value is split across infrastructure and governance.</p>
          {allocationRows.length === 0 ? (
            <p className="bp-empty-note">Allocation breakdown appears after verified funding contributions.</p>
          ) : (
            <ul className="bp-roi-allocation">
              {allocationRows.map((row) => (
                <li key={row.key}>
                  <div className="bp-roi-allocation-head">
                    <span>{row.label}</span>
                    <strong>{formatZar(row.value)}</strong>
                  </div>
                  <div className="bp-roi-allocation-track" aria-hidden="true">
                    <div className="bp-roi-allocation-fill" style={{ width: `${row.share}%` }} />
                  </div>
                  <span className="bp-muted">{row.share}%</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="bp-panel bp-roi-panel bp-roi-panel--wide">
          <h2>Campaign ROI</h2>
          {data.campaigns.length === 0 ? (
            <p className="bp-empty-note">Campaign ROI rows appear once campaigns have verified submissions.</p>
          ) : (
            <div className="bp-table-wrap">
              <table className="bp-table bp-roi-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Investment</th>
                    <th>Impact delivered</th>
                    <th>Verified</th>
                    <th>Schools</th>
                    <th>Cost / verified</th>
                    <th>Progress</th>
                    <th>Milestones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                      </td>
                      <td>{formatZar(c.investmentZar)}</td>
                      <td>{formatZar(c.impactDeliveredZar)}</td>
                      <td>{formatCount(c.validSubmissions)}</td>
                      <td>{formatCount(c.schoolsReached)}</td>
                      <td>{formatZar(c.costPerVerifiedZar)}</td>
                      <td>{c.progressPercent}%</td>
                      <td>{formatCount(c.infrastructureMilestones)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="bp-panel bp-roi-panel bp-roi-panel--wide">
          <h2>Provincial ROI</h2>
          {data.provinces.length === 0 ? (
            <p className="bp-empty-note">Provincial cost efficiency appears after verified submissions.</p>
          ) : (
            <div className="bp-roi-province-grid">
              {data.provinces.map((p) => (
                <div key={p.code} className="bp-roi-province-card">
                  <strong>{p.name}</strong>
                  <span>{formatCount(p.verifiedSubmissions)} verified</span>
                  <span>{formatCount(p.schools)} schools</span>
                  <span>Impact {formatZar(p.impactZar)}</span>
                  <span className="bp-roi-province-cost">{formatZar(p.costPerVerifiedZar)} / verified</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="bp-panel bp-roi-panel bp-roi-panel--wide">
          <h2>
            <Building2 size={18} /> Infrastructure milestones
          </h2>
          {data.infrastructureProgress.every((r) => r.progressPercent === 0) ? (
            <p className="bp-empty-note">Infrastructure progress tracks as verified deliveries accumulate.</p>
          ) : (
            <div className="bp-roi-infra-grid">
              {data.infrastructureProgress
                .filter((r) => r.progressPercent > 0 || r.verifiedDeliveries > 0)
                .map((row) => (
                  <div key={row.category} className="bp-roi-infra-card">
                    <strong>{row.category}</strong>
                    <div className="bp-roi-infra-track" aria-hidden="true">
                      <div className="bp-roi-infra-fill" style={{ width: `${row.progressPercent}%` }} />
                    </div>
                    <span>
                      {row.progressPercent}% · {formatCount(row.verifiedDeliveries)} deliveries ·{" "}
                      {formatCount(row.schoolsCount)} schools
                    </span>
                  </div>
                ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
