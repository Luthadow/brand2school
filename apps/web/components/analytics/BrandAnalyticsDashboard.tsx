"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  Activity,
  BarChart3,
  Download,
  FileText,
  LogOut,
  MapPin,
  RefreshCw,
  School,
  Shield,
  ShieldCheck,
  TrendingUp,
  Users
} from "lucide-react";
import { brandCsrfHeaders } from "../../lib/brandClientFetch";
import { formatCount } from "../../lib/formatCount";
import type { BrandAnalytics } from "../../lib/analytics";
import { CONTACT, mailto } from "../../lib/contact";
import { CampaignMetricsTable } from "./CampaignMetricsTable";
import { ProvinceHeatmap } from "./ProvinceHeatmap";
import { ChannelMixChart } from "./charts/ChannelMixChart";
import { EsgScorecard } from "./charts/EsgScorecard";
import { FraudAnalyticsChart } from "./charts/FraudAnalyticsChart";
import { FunnelChart } from "./charts/FunnelChart";
import { InfrastructureProgressChart } from "./charts/InfrastructureProgressChart";
import { ParticipationTrendChart } from "./charts/ParticipationTrendChart";
import { CampaignPerformanceChart } from "./charts/CampaignPerformanceChart";
import { SubmissionTrendChart } from "./charts/SubmissionTrendChart";

function formatPeriod(from: string, to: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  return `${new Date(from).toLocaleDateString("en-ZA", opts)} – ${new Date(to).toLocaleDateString("en-ZA", opts)}`;
}

export function BrandAnalyticsDashboard({
  initialData,
  embedded = false
}: {
  initialData: BrandAnalytics;
  embedded?: boolean;
}): JSX.Element {
  const [data, setData] = useState(initialData);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function refresh(campaignId?: string | null): Promise<void> {
    setLoading(true);
    try {
      const qs = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : "";
      const res = await fetch(`/api/analytics/brand${qs}`, { cache: "no-store" });
      if (res.ok) setData((await res.json()) as BrandAnalytics);
    } finally {
      setLoading(false);
    }
  }

  async function exportPdf(): Promise<void> {
    setExporting(true);
    try {
      const qs = selectedCampaign ? `?campaignId=${encodeURIComponent(selectedCampaign)}` : "";
      const res = await fetch(`/api/analytics/brand/esg-report${qs}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        res.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] ??
        "brand2school-esg-report.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  function handleCampaignSelect(id: string | null): void {
    setSelectedCampaign(id);
    void refresh(id);
  }

  async function logout(): Promise<void> {
    await fetch("/api/brand/auth/logout", { method: "POST", headers: brandCsrfHeaders() });
    window.location.href = "/brand/login";
  }

  const summaryCards = [
    { label: "Valid submissions", value: data.summary.validSubmissions, icon: Activity },
    { label: "Fraud blocked", value: data.trust.fraudAttemptsBlocked, icon: Shield },
    { label: "Schools reached", value: data.summary.schoolsReached, icon: School },
    { label: "Participation events", value: data.summary.learnersReached, icon: Users },
    { label: "Duplicates rejected", value: data.trust.duplicateCodesRejected, icon: ShieldCheck },
    { label: "Code utilization", value: `${data.summary.codeUtilization}%`, icon: FileText }
  ];

  return (
    <main className={`ba${embedded ? " ba--embedded" : ""}`}>
      {!embedded ? (
      <section className="ba-hero">
        <div className="ba-container ba-hero-inner">
          <div>
            <p className="ds-eyebrow">Impact Intelligence</p>
            <h1>Brand Analytics Dashboard</h1>
            <p className="ba-hero-sub">
              Province heatmaps, campaign performance, and board-ready ESG reporting — the measurement layer
              behind recurring brand contracts.
            </p>
            <p className="ba-hero-period">{formatPeriod(data.period.from, data.period.to)}</p>
          </div>
          <div className="ba-hero-actions">
            <button
              type="button"
              className="ds-btn ds-btn-primary"
              onClick={() => void exportPdf()}
              disabled={exporting}
            >
              <Download size={18} />
              {exporting ? "Generating PDF…" : "Export ESG Report"}
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-secondary"
              onClick={() => void refresh(selectedCampaign)}
              disabled={loading}
            >
              <RefreshCw size={18} className={loading ? "ba-spin" : undefined} />
              Refresh
            </button>
            <Link href={"/for-brands" as Route} className="ds-btn ds-btn-green">
              Partner Pricing
            </Link>
            <button type="button" className="ds-btn ds-btn-secondary" onClick={() => void logout()}>
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </div>
        <div className="ba-container">
          <span className={`ba-source ba-source--${data.dataSource}`}>
            Live network data
          </span>
        </div>
      </section>
      ) : null}

      <section className="ba-section">
        <div className="ba-container">
          <div className="ba-section-head">
            <TrendingUp size={22} />
            <div>
              <h2>ESG Impact Scorecard</h2>
              <p>Executive KPIs that answer whether this platform can be trusted — measurable impact for boards and ESG teams.</p>
            </div>
          </div>
          <EsgScorecard summary={data.summary} />
          <div className="ba-summary-grid" style={{ marginTop: "1rem" }}>
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.label} className="ba-summary-card">
                  <Icon size={22} />
                  <strong>{typeof card.value === "number" ? formatCount(card.value) : card.value}</strong>
                  <span>{card.label}</span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="ba-section ba-section-light">
        <div className="ba-container">
          <div className="ba-section-head">
            <TrendingUp size={22} />
            <div>
              <h2>Submission Trend</h2>
              <p>Daily, weekly, and monthly verified participation — campaign momentum and platform growth.</p>
            </div>
          </div>
          <div className="ba-panel">
            <SubmissionTrendChart trend={data.submissionTrend} />
          </div>
        </div>
      </section>

      <section className="ba-section">
        <div className="ba-container ba-split">
          <div className="ba-panel">
            <h2>School Infrastructure Progress</h2>
            <p className="ba-panel-sub">Core social impact proof across infrastructure categories.</p>
            <InfrastructureProgressChart rows={data.infrastructureProgress} />
          </div>
          <div className="ba-panel">
            <h2>Transformation Funnel</h2>
            <p className="ba-panel-sub">Operational effectiveness from registration to completion.</p>
            <FunnelChart stages={data.funnel} />
          </div>
        </div>
      </section>

      <section className="ba-section ba-trust-section">
          <div className="ba-container">
            <div className="ba-section-head">
              <Shield size={22} />
              <div>
                <h2>Fraud Protection Active</h2>
                <p>
                  Every submission is verified, auditable, and non-reusable — enterprise-grade participation
                  infrastructure brands can trust.
                </p>
              </div>
            </div>
            <div className="ba-trust-grid">
              <article className="ba-trust-card ba-trust-card--hero">
                <p className="ba-trust-status">
                  <ShieldCheck size={20} />
                  Trust layer operational
                </p>
                <ul className="ba-trust-protections">
                  {data.trust.protections.map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
                <p className="ba-trust-meta">{formatCount(data.trust.auditEventsLogged)} immutable audit events logged</p>
              </article>
              <article className="ba-trust-card">
                <h3>Blocked threats</h3>
                <div className="ba-trust-stats">
                  <div>
                    <strong>{formatCount(data.trust.fraudAttemptsBlocked)}</strong>
                    <span>Fraud blocked</span>
                  </div>
                  <div>
                    <strong>{formatCount(data.trust.duplicateCodesRejected)}</strong>
                    <span>Duplicates rejected</span>
                  </div>
                  <div>
                    <strong>{formatCount(data.trust.invalidCodesRejected)}</strong>
                    <span>Invalid codes</span>
                  </div>
                  <div>
                    <strong>{formatCount(data.trust.flaggedSubmissions)}</strong>
                    <span>Flagged for review</span>
                  </div>
                </div>
              </article>
              <article className="ba-trust-card">
                <h3>Recent audit trail</h3>
                <ul className="ba-audit-list">
                  {data.trust.recentAuditEvents.map((event) => (
                    <li key={`${event.action}-${event.createdAt}`}>
                      <strong>{event.action.replace(/_/g, " ")}</strong>
                      <span>{event.summary}</span>
                      <time>
                        {new Date(event.createdAt).toLocaleString("en-ZA", {
                          timeZone: "Africa/Johannesburg",
                          dateStyle: "medium",
                          timeStyle: "short"
                        })}
                      </time>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
      </section>

      <section className="ba-section ba-section-light">
        <div className="ba-container">
          <div className="ba-section-head">
            <MapPin size={22} />
            <div>
              <h2>Province Participation Heatmap</h2>
              <p>Aggregated submissions across South Africa&apos;s 9 provinces — anonymized regional intelligence.</p>
            </div>
          </div>
          <ProvinceHeatmap provinces={data.provinces} />
        </div>
      </section>

      <section className="ba-section">
        <div className="ba-container ba-split">
          <div className="ba-panel">
            <h2>Consumer Participation Trends</h2>
            <p className="ba-panel-sub">Active and repeat participants over time.</p>
            <ParticipationTrendChart rows={data.participationTrend} />
          </div>
          <div className="ba-panel">
            <h2>Verification Channels</h2>
            <p className="ba-panel-sub">WhatsApp vs web submission mix and approval context.</p>
            <ChannelMixChart rows={data.channelMix} />
          </div>
        </div>
      </section>

      <section className="ba-section ba-section-light">
        <div className="ba-container">
          <div className="ba-section-head">
            <Shield size={22} />
            <div>
              <h2>Fraud Detection Trend</h2>
              <p>System integrity over time — builds investor, brand, and public trust.</p>
            </div>
          </div>
          <div className="ba-panel">
            <FraudAnalyticsChart fraudTrend={data.fraudTrend} fraudByOutcome={data.trust.fraudByOutcome} />
          </div>
        </div>
      </section>

      <section className="ba-section">
        <div className="ba-container">
          <div className="ba-panel">
            <h2>Top Schools</h2>
            <p className="ba-panel-sub">Highest verified submission volume — community momentum.</p>
            <ol className="ba-top-schools">
              {data.topSchools.map((school, i) => (
                <li key={school.schoolName}>
                  <span className="ba-rank">{i + 1}</span>
                  <div>
                    <strong>{school.schoolName}</strong>
                    <span>
                      {school.province} · {formatCount(school.submissions)} submissions
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="ba-section ba-section-light">
        <div className="ba-container">
          <div className="ba-section-head">
            <BarChart3 size={22} />
            <div>
              <h2>Campaign Performance Analytics</h2>
              <p>ESG reporting engine — verification, engagement, and rejection rates per active mission.</p>
            </div>
          </div>
          <div className="ba-panel">
            <CampaignPerformanceChart campaigns={data.campaigns} />
          </div>
        </div>
      </section>

      <section className="ba-section ba-section-dark">
        <div className="ba-container">
          <div className="ba-section-head ba-section-head--light">
            <BarChart3 size={22} />
            <div>
              <h2>Campaign Metrics</h2>
              <p>Click a row to filter the dashboard to a single campaign. Export generates a campaign-specific ESG PDF.</p>
            </div>
          </div>
          <CampaignMetricsTable
            campaigns={data.campaigns}
            selectedId={selectedCampaign}
            onSelect={handleCampaignSelect}
          />
        </div>
      </section>

      <section className="ba-section ba-esg-cta">
        <div className="ba-container ba-esg-cta-inner">
          <h2>Turn Reports Into Recurring Contracts</h2>
          <p>
            This dashboard is the product behind ESG subscriptions — province analytics, learner reach, and
            verified delivery evidence for boards and compliance teams.
          </p>
          <div className="ba-hero-actions">
            <button type="button" className="ds-btn ds-btn-primary ds-btn-lg" onClick={() => void exportPdf()} disabled={exporting}>
              <Download size={18} />
              Download ESG / CSI Report
            </button>
            <a href={mailto(CONTACT.brands, "Brand partnership enquiry")} className="ds-btn ds-btn-secondary ds-btn-lg">
              {CONTACT.brands}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
