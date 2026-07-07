"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  MapPin,
  Megaphone,
  RefreshCw,
  School,
  Shield,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import { formatCount } from "../../lib/formatCount";
import type { BrandPortal } from "../../lib/brandPortal";
import { campaignStatusLabel, formatZar } from "../../lib/brandPortal";
import { useBrandPortal } from "./BrandPortalContext";

function Sparkline({ values }: { values: number[] }): JSX.Element {
  if (values.length === 0) {
    return <div className="bp-cmd-sparkline bp-cmd-sparkline--empty" aria-hidden="true" />;
  }

  const max = Math.max(...values, 1);
  const width = 140;
  const height = 40;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - (v / max) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="bp-cmd-sparkline" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" points={points} />
    </svg>
  );
}

function statusBadgeClass(status: BrandPortal["campaigns"][number]["status"]): string {
  const map: Record<BrandPortal["campaigns"][number]["status"], string> = {
    active: "bp-cmd-badge--live",
    pending: "bp-cmd-badge--pending",
    completed: "bp-cmd-badge--done",
    paused: "bp-cmd-badge--paused"
  };
  return map[status];
}

export function BrandOverview(): JSX.Element {
  const initialPortal = useBrandPortal();
  const [portal, setPortal] = useState(initialPortal);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (campaignId: string | null): Promise<void> => {
    setLoading(true);
    try {
      const qs = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : "";
      const res = await fetch(`/api/analytics/brand/portal${qs}`, { cache: "no-store" });
      if (res.ok) setPortal((await res.json()) as BrandPortal);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleCampaignChange(id: string): void {
    const nextId = id === "all" ? null : id;
    setSelectedCampaignId(nextId);
    void refresh(nextId);
  }

  const { overview, analytics, campaigns, codeInventory } = portal;
  const trust = analytics.trust;

  const activeCampaign = useMemo(() => {
    if (selectedCampaignId) {
      return campaigns.find((c) => c.id === selectedCampaignId) ?? campaigns[0];
    }
    return campaigns.find((c) => c.status === "active") ?? campaigns[0];
  }, [campaigns, selectedCampaignId]);

  const campaignProgress = activeCampaign
    ? Math.min(
        100,
        Math.round(
          (activeCampaign.validSubmissions / Math.max(activeCampaign.targetSubmissions, 1)) * 1000
        ) / 10
      )
    : 0;

  const last7Days = analytics.submissionTrend.daily.slice(-7).map((d) => d.verified);
  const last7Total = last7Days.reduce((a, b) => a + b, 0);

  const provinceRows = [...analytics.provinces]
    .filter((p) => p.submissions > 0)
    .sort((a, b) => b.submissions - a.submissions)
    .slice(0, 9);

  const fraudWeek = analytics.fraudTrend.slice(-1)[0];
  const isLive = activeCampaign?.status === "active";

  const kpiStrip = [
    { label: "Codes submitted", value: overview.totalSubmissions, icon: Target },
    { label: "Verified", value: overview.verifiedSubmissions, icon: CheckCircle2 },
    { label: "Duplicates blocked", value: trust.duplicateCodesRejected, icon: ShieldCheck },
    { label: "Fraud blocked", value: trust.fraudAttemptsBlocked, icon: Shield },
    { label: "Participation rate", value: `${analytics.summary.engagementRate}%`, icon: Activity },
    { label: "Schools reached", value: analytics.summary.schoolsReached, icon: School },
    { label: "Provinces", value: analytics.summary.provincesReached, icon: MapPin },
    { label: "Learners reached", value: analytics.summary.learnersReached, icon: Users },
    { label: "Code utilization", value: `${codeInventory.utilizationPercent}%`, icon: Zap },
    { label: "Campaign progress", value: `${campaignProgress}%`, icon: TrendingUp }
  ];

  const quickActions: Array<{ href: Route; label: string; icon: typeof Megaphone }> = [
    { href: "/brand/dashboard/campaigns/new" as Route, label: "Create campaign", icon: Megaphone },
    { href: "/brand/dashboard/inventory" as Route, label: "Code inventory", icon: Target },
    { href: "/brand/dashboard/roi" as Route, label: "ROI dashboard", icon: TrendingUp },
    { href: "/brand/dashboard/reports", label: "ESG reports", icon: Download }
  ];

  return (
    <div className="bp-page">
      <header className="bp-cmd-header">
        <div className="bp-cmd-header-main">
          <p className="ds-eyebrow">Brand Command Centre</p>
          <h1>Campaign performance at a glance</h1>
          <p className="bp-cmd-sub">
            Real-time participation, fraud protection, and geographic reach — built for marketing and CSI teams.
          </p>
        </div>
        <div className="bp-cmd-header-controls">
          <label className="bp-cmd-select-wrap">
            <span>Campaign</span>
            <select
              className="bp-cmd-select"
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
          {activeCampaign ? (
            <span className={`bp-cmd-badge ${statusBadgeClass(activeCampaign.status)}`}>
              {isLive ? "● LIVE" : campaignStatusLabel(activeCampaign.status).toUpperCase()}
            </span>
          ) : null}
          <button
            type="button"
            className="bp-cmd-refresh"
            onClick={() => void refresh(selectedCampaignId)}
            disabled={loading}
            aria-label="Refresh dashboard"
          >
            <RefreshCw size={16} className={loading ? "ba-spin" : undefined} />
          </button>
        </div>
      </header>

      {activeCampaign ? (
        <section className="bp-cmd-campaign-bar">
          <div>
            <strong>{activeCampaign.name}</strong>
            <span>
              {activeCampaign.category ?? "Campaign"} · Target {formatCount(activeCampaign.targetSubmissions)} codes ·{" "}
              {formatCount(activeCampaign.validSubmissions)} verified
            </span>
          </div>
          <div className="bp-cmd-progress">
            <div className="bp-cmd-progress-track" aria-hidden="true">
              <div className="bp-cmd-progress-fill" style={{ width: `${campaignProgress}%` }} />
            </div>
            <span>{campaignProgress}% to target</span>
          </div>
        </section>
      ) : null}

      <section className="bp-cmd-kpi-strip" aria-label="Campaign KPIs">
        {kpiStrip.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article key={kpi.label} className="bp-cmd-kpi">
              <Icon size={18} />
              <strong>{typeof kpi.value === "number" ? formatCount(kpi.value) : kpi.value}</strong>
              <span>{kpi.label}</span>
            </article>
          );
        })}
      </section>

      <section className="bp-cmd-grid">
        <article className="bp-panel bp-cmd-panel">
          <div className="bp-cmd-panel-head">
            <h2>7-day verified trend</h2>
            <span className="bp-cmd-trend-total">{formatCount(last7Total)} this week</span>
          </div>
          <Sparkline values={last7Days} />
          <p className="bp-muted">Daily verified code submissions — last 7 days</p>
        </article>

        <article className="bp-panel bp-cmd-panel">
          <h2>Code inventory</h2>
          <p className="bp-muted">{formatCount(codeInventory.totalCodes)} codes across {codeInventory.batchesCount} batches</p>
          <ul className="bp-cmd-inventory">
            <li>
              <span>Unused</span>
              <strong>{formatCount(codeInventory.unused)}</strong>
            </li>
            <li>
              <span>Used</span>
              <strong>{formatCount(codeInventory.used)}</strong>
            </li>
            <li>
              <span>Expired</span>
              <strong>{formatCount(codeInventory.expired)}</strong>
            </li>
            <li>
              <span>Flagged / blocked</span>
              <strong>{formatCount(codeInventory.flagged + codeInventory.blocked)}</strong>
            </li>
          </ul>
          <Link href={"/brand/dashboard/inventory" as Route} className="bp-cmd-action" style={{ marginTop: "0.75rem" }}>
            <Target size={18} />
            View full inventory
          </Link>
        </article>

        <article className="bp-panel bp-cmd-panel bp-cmd-panel--wide">
          <h2>Provincial reach</h2>
          <p className="bp-muted">Verified submissions by province</p>
          {provinceRows.length === 0 ? (
            <p className="bp-empty-note">Provincial data appears after your first verified submissions.</p>
          ) : (
            <div className="bp-cmd-province-bars">
              {provinceRows.map((p) => (
                <div key={p.code} className="bp-cmd-province-row">
                  <span className="bp-cmd-province-name">{p.name}</span>
                  <div className="bp-cmd-province-track" aria-hidden="true">
                    <div className="bp-cmd-province-fill" style={{ width: `${p.intensity}%` }} />
                  </div>
                  <span className="bp-cmd-province-count">{formatCount(p.submissions)}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="bp-panel bp-cmd-panel">
          <div className="bp-cmd-panel-head">
            <h2>
              <Shield size={18} /> Fraud &amp; integrity
            </h2>
            {trust.protectionActive ? (
              <span className="bp-cmd-badge bp-cmd-badge--live">Protection active</span>
            ) : null}
          </div>
          <ul className="bp-cmd-fraud-stats">
            <li>
              <AlertTriangle size={16} />
              <span>Fraud blocked</span>
              <strong>{formatCount(trust.fraudAttemptsBlocked)}</strong>
            </li>
            <li>
              <ShieldCheck size={16} />
              <span>Duplicates rejected</span>
              <strong>{formatCount(trust.duplicateCodesRejected)}</strong>
            </li>
            <li>
              <Shield size={16} />
              <span>Invalid codes</span>
              <strong>{formatCount(trust.invalidCodesRejected)}</strong>
            </li>
            <li>
              <Activity size={16} />
              <span>Flagged for review</span>
              <strong>{formatCount(trust.flaggedSubmissions)}</strong>
            </li>
          </ul>
          {fraudWeek ? (
            <p className="bp-muted">
              Latest week: {formatCount(fraudWeek.blocked)} blocked · {formatCount(fraudWeek.duplicates)} duplicates
            </p>
          ) : null}
        </article>

        <article className="bp-panel bp-cmd-panel">
          <h2>Impact value</h2>
          <p className="bp-cmd-impact-value">{formatZar(overview.impactValueZar)}</p>
          <p className="bp-muted">
            {overview.verificationRate}% verification rate · {formatCount(overview.estimatedLivesImpacted)} lives
            impacted (est.)
          </p>
          <ul className="bp-cmd-protections">
            {trust.protections.slice(0, 4).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </article>

        <article className="bp-panel bp-cmd-panel">
          <h2>Quick actions</h2>
          <div className="bp-cmd-actions">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href} className="bp-cmd-action">
                  <Icon size={18} />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}
