"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { PlatformExecutiveAnalytics } from "../../lib/executiveAnalytics";
import { useAdminSession } from "./useAdminSession";

const CHART_COLORS = ["#003b8e", "#6cc24a", "#f7931e", "#4da3ff", "#0e9f6e", "#dc2626"];

type PlatformSnapshot = {
  generatedAt: string;
  schoolsRegistered: number;
  schoolsPendingApproval: number;
  schoolsInApprovalPipeline: number;
  schoolsActive: number;
  pendingBrands: number;
  openFraudFlags: number;
  pendingUsers: number;
  totalSubmissions: number;
  verifiedSubmissions: number;
  verificationPacketsPendingReview: number;
  recentVerificationSubmissions: Array<{
    schoolId: string;
    schoolName: string;
    province: string;
    district: string;
    principalName: string;
    organizationCategory: string;
    verificationStatus: string;
    submittedAt: string;
  }>;
  schoolRegistrationTrend: Array<{ period: string; count: number }>;
};

type WorkflowResponse = {
  pipeline: Record<string, number>;
};

const quickLinks: Array<{ href: Route; label: string; desc: string; tone: string }> = [
  { href: "/dashboard/analytics", label: "Executive analytics", desc: "ESG KPIs, trends, fraud", tone: "blue" },
  { href: "/dashboard/approvals", label: "Approvals", desc: "Schools, brands, users", tone: "green" },
  { href: "/dashboard/commercial", label: "Commercial", desc: "Brand onboarding pipeline", tone: "orange" },
  { href: "/dashboard/moderation", label: "Moderation", desc: "Fraud flags & velocity", tone: "red" }
];

export function DashboardOverviewClient(): JSX.Element {
  const { session } = useAdminSession();
  const isSuperAdmin = session?.user.role === "SUPER_ADMIN";
  const [analytics, setAnalytics] = useState<PlatformExecutiveAnalytics | null>(null);
  const [snapshot, setSnapshot] = useState<PlatformSnapshot | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const fetches: Promise<Response>[] = [
          fetch("/api/admin/platform-snapshot", { cache: "no-store" })
        ];
        if (isSuperAdmin) {
          fetches.push(
            fetch("/api/admin/analytics/executive", { cache: "no-store" }),
            fetch("/api/admin/commercial/workflow", { cache: "no-store" })
          );
        }
        const results = await Promise.all(fetches);
        if (!results[0].ok) {
          setError("Could not load platform snapshot.");
          return;
        }
        setSnapshot((await results[0].json()) as PlatformSnapshot);
        if (isSuperAdmin) {
          if (results[1]?.ok) setAnalytics((await results[1].json()) as PlatformExecutiveAnalytics);
          if (results[2]?.ok) setWorkflow((await results[2].json()) as WorkflowResponse);
        }
      } catch {
        setError("Dashboard data failed to load.");
      }
    })();
  }, [isSuperAdmin]);

  const submissionTrendData = useMemo(() => {
    const weekly = analytics?.submissionTrend.weekly ?? [];
    if (weekly.length > 0) return weekly;
    return [{ period: "No submissions yet", verified: 0, total: 0 }];
  }, [analytics]);

  const registrationTrendData = useMemo(
    () => snapshot?.schoolRegistrationTrend ?? [{ period: "—", count: 0 }],
    [snapshot]
  );

  const showRegistrationTrend = (analytics?.submissionTrend.weekly.length ?? 0) === 0;

  const pipelineData = useMemo(() => {
    if (!workflow?.pipeline) return [];
    return Object.entries(workflow.pipeline)
      .filter(([, count]) => count > 0)
      .map(([stage, count]) => ({
        stage: stage.replace(/_/g, " "),
        count
      }))
      .slice(0, 8);
  }, [workflow]);

  if (error) return <p className="admin-alert admin-alert--error">{error}</p>;
  if (!snapshot) {
    return (
      <div className="admin-loading">
        <div className="admin-loading__spinner" aria-hidden />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  const kpis = analytics
    ? analytics.kpis.slice(0, 4)
    : [
        {
          key: "schoolsRegistered",
          label: "Schools registered",
          value: snapshot.schoolsRegistered,
          format: "count" as const
        },
        {
          key: "totalSubmissions",
          label: "Total submissions",
          value: snapshot.totalSubmissions,
          format: "count" as const
        },
        {
          key: "verifiedSubmissions",
          label: "Verified submissions",
          value: snapshot.verifiedSubmissions,
          format: "count" as const
        },
        {
          key: "schoolsActive",
          label: "Schools active",
          value: snapshot.schoolsActive,
          format: "count" as const
        }
      ];

  return (
    <div className="admin-dashboard">
      <header className="admin-page-head">
        <div>
          <p className="admin-page-head__eyebrow">Platform overview</p>
          <h1>Admin dashboard</h1>
          <p className="admin-page-head__sub">
            Live governance, registrations, and measurable education infrastructure impact.
          </p>
        </div>
        <time className="admin-page-head__time" dateTime={snapshot.generatedAt}>
          Updated {new Date(snapshot.generatedAt).toLocaleString("en-ZA")}
        </time>
      </header>

      {snapshot.verificationPacketsPendingReview > 0 ? (
        <section className="admin-verification-alert" aria-live="polite">
          <div className="admin-verification-alert__head">
            <strong>
              {snapshot.verificationPacketsPendingReview} organisation
              {snapshot.verificationPacketsPendingReview === 1 ? "" : "s"} submitted verification documents
            </strong>
            <p>Review packets on the Verify screen — you do not need to wait for schools to contact you.</p>
          </div>
          <Link href="/dashboard/approvals" className="admin-verification-alert__cta">
            Open approvals queue →
          </Link>
        </section>
      ) : null}

      {snapshot.recentVerificationSubmissions.length > 0 ? (
        <section className="admin-verification-feed card" aria-label="Recent verification submissions">
          <h2>Recent document submissions</h2>
          <ul className="admin-verification-feed__list">
            {snapshot.recentVerificationSubmissions.slice(0, 6).map((item) => (
              <li key={`${item.schoolId}-${item.submittedAt}`}>
                <div>
                  <Link href={`/dashboard/schools/${item.schoolId}/verification`}>{item.schoolName}</Link>
                  <span className="admin-verification-feed__meta">
                    {item.district}, {item.province} · {item.verificationStatus.replace(/_/g, " ")}
                  </span>
                </div>
                <time dateTime={item.submittedAt}>
                  {new Date(item.submittedAt).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" })}
                </time>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="admin-pending-strip" aria-label="Platform counts">
        <div className="admin-pending-pill admin-pending-pill--static">
          <span className="admin-pending-pill__value">{snapshot.schoolsRegistered}</span>
          <span className="admin-pending-pill__label">Schools registered</span>
        </div>
        <Link href="/dashboard/approvals" className="admin-pending-pill">
          <span className="admin-pending-pill__value">{snapshot.schoolsPendingApproval}</span>
          <span className="admin-pending-pill__label">Awaiting approval (PENDING)</span>
        </Link>
        <Link href="/dashboard/approvals" className="admin-pending-pill">
          <span className="admin-pending-pill__value">{snapshot.pendingBrands}</span>
          <span className="admin-pending-pill__label">Brands in pipeline</span>
        </Link>
        <Link href="/dashboard/approvals" className="admin-pending-pill admin-pending-pill--warn">
          <span className="admin-pending-pill__value">{snapshot.verificationPacketsPendingReview}</span>
          <span className="admin-pending-pill__label">Docs awaiting review</span>
        </Link>
        <Link href="/dashboard/moderation" className="admin-pending-pill admin-pending-pill--warn">
          <span className="admin-pending-pill__value">{snapshot.openFraudFlags}</span>
          <span className="admin-pending-pill__label">Open fraud flags</span>
        </Link>
      </section>

      <p className="admin-metrics-note">
        Registered = all schools that completed public signup. &quot;Awaiting approval&quot; is entity status{" "}
        <strong>PENDING</strong> only.
      </p>

      <section className="admin-kpi-grid">
        {kpis.map((kpi) => (
          <article key={kpi.key} className="admin-kpi-card">
            <span className="admin-kpi-card__label">{kpi.label}</span>
            <strong className="admin-kpi-card__value">
              {kpi.format === "percent" ? `${kpi.value}%` : kpi.value.toLocaleString("en-ZA")}
            </strong>
            {typeof kpi.trendPercent === "number" ? (
              <span className={`admin-kpi-card__trend${kpi.trendPercent < 0 ? " admin-kpi-card__trend--down" : ""}`}>
                {kpi.trendPercent >= 0 ? "+" : ""}
                {kpi.trendPercent}% vs prior month
              </span>
            ) : null}
          </article>
        ))}
      </section>

      <section className="admin-chart-grid admin-chart-grid--2">
        <article className="admin-chart-card">
          <div className="admin-chart-card__head">
            <h2>{showRegistrationTrend ? "School registrations" : "Submission trend"}</h2>
            <span className="admin-chart-card__meta">
              {showRegistrationTrend ? "New schools per week (live DB)" : "Weekly verified vs total"}
            </span>
          </div>
          {showRegistrationTrend ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={registrationTrendData}>
                <CartesianGrid stroke="#e8f0ff" strokeDasharray="4 4" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#6b7c96" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7c96" }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #dfebff" }} />
                <Bar dataKey="count" fill="#003b8e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={submissionTrendData}>
              <defs>
                <linearGradient id="verifiedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6cc24a" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6cc24a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#003b8e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#003b8e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e8f0ff" strokeDasharray="4 4" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#6b7c96" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7c96" }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #dfebff" }} />
              <Legend />
              <Area type="monotone" dataKey="verified" stroke="#6cc24a" fill="url(#verifiedGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="total" stroke="#003b8e" fill="url(#totalGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </article>

        <article className="admin-chart-card">
          <div className="admin-chart-card__head">
            <h2>Transformation funnel</h2>
            <span className="admin-chart-card__meta">Registered schools through campaigns</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics?.funnel ?? [{ stage: "Registered", count: snapshot.schoolsRegistered }]}>
              <CartesianGrid stroke="#e8f0ff" strokeDasharray="4 4" />
              <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "#6b7c96" }} interval={0} angle={-12} textAnchor="end" height={56} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7c96" }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #dfebff" }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {(analytics?.funnel ?? [{ stage: "Registered", count: snapshot.schoolsRegistered }]).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>

      {analytics ? (
      <section className="admin-chart-grid admin-chart-grid--3">
        <article className="admin-chart-card">
          <div className="admin-chart-card__head">
            <h2>Verification channels</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={analytics.channelMix.length > 0 ? analytics.channelMix : [{ channel: "No data", count: 1 }]}
                dataKey="count"
                nameKey="channel"
                innerRadius={52}
                outerRadius={88}
                paddingAngle={2}
              >
                {(analytics.channelMix.length > 0 ? analytics.channelMix : [{ channel: "No data", count: 1 }]).map((row, index) => (
                  <Cell key={row.channel} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #dfebff" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </article>

        <article className="admin-chart-card">
          <div className="admin-chart-card__head">
            <h2>Infrastructure progress</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics.infrastructureProgress} layout="vertical">
              <CartesianGrid stroke="#e8f0ff" strokeDasharray="4 4" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7c96" }} />
              <YAxis type="category" dataKey="category" width={96} tick={{ fontSize: 10, fill: "#6b7c96" }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #dfebff" }} />
              <Bar dataKey="progressPercent" fill="#003b8e" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="admin-chart-card">
          <div className="admin-chart-card__head">
            <h2>Fraud trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={analytics.fraudTrend}>
              <CartesianGrid stroke="#e8f0ff" strokeDasharray="4 4" />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#6b7c96" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7c96" }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #dfebff" }} />
              <Area type="monotone" dataKey="blocked" stackId="1" stroke="#dc2626" fill="#fecaca" />
              <Area type="monotone" dataKey="duplicates" stackId="1" stroke="#f7931e" fill="#fed7aa" />
            </AreaChart>
          </ResponsiveContainer>
        </article>
      </section>
      ) : null}

      {isSuperAdmin && analytics && pipelineData.length > 0 ? (
        <section className="admin-chart-card">
          <div className="admin-chart-card__head">
            <h2>Commercial pipeline</h2>
            <Link href="/dashboard/commercial" className="admin-chart-card__link">
              Open workflow →
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pipelineData}>
              <CartesianGrid stroke="#e8f0ff" strokeDasharray="4 4" />
              <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "#6b7c96" }} interval={0} angle={-18} textAnchor="end" height={64} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7c96" }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #dfebff" }} />
              <Bar dataKey="count" fill="#f7931e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      ) : null}

      {analytics ? (
      <section className="admin-bottom-grid">
        <article className="admin-chart-card">
          <div className="admin-chart-card__head">
            <h2>Brand impact rankings</h2>
            <Link href="/dashboard/analytics" className="admin-chart-card__link">
              Full analytics →
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={
                analytics.brandRankings.length > 0
                  ? analytics.brandRankings.slice(0, 6)
                  : [{ brandName: "No brand submissions", impactScore: 0 }]
              }
            >
              <CartesianGrid stroke="#e8f0ff" strokeDasharray="4 4" />
              <XAxis dataKey="brandName" tick={{ fontSize: 10, fill: "#6b7c96" }} interval={0} angle={-15} textAnchor="end" height={56} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7c96" }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #dfebff" }} />
              <Bar dataKey="impactScore" fill="#6cc24a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="admin-chart-card admin-feed-card">
          <div className="admin-chart-card__head">
            <h2>Live activity</h2>
          </div>
          <ul className="admin-feed">
            {analytics.liveFeed.slice(0, 8).map((item) => (
              <li key={`${item.createdAt}-${item.message}`}>
                <span>{item.message}</span>
                <time>{new Date(item.createdAt).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" })}</time>
              </li>
            ))}
          </ul>
        </article>
      </section>
      ) : null}

      {isSuperAdmin ? (
        <section className="admin-quick-grid">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className={`admin-quick-card admin-quick-card--${link.tone}`}>
              <strong>{link.label}</strong>
              <span>{link.desc}</span>
            </Link>
          ))}
        </section>
      ) : null}
    </div>
  );
}
