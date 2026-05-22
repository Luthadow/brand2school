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

type PageMeta = { page: number; pageSize: number; total: number; totalPages: number };

type QueueMeta = {
  pendingUsers: PageMeta;
  pendingSchools: PageMeta;
  pendingBrands: PageMeta;
  openFraudFlags: PageMeta;
};

type QueueResponse = {
  pendingSchools: Array<{ id: string; name: string; district: string; status: string }>;
  pendingBrands: Array<{ id: string; name: string; status: string }>;
  openFraudFlags: Array<{ id: string; reason: string }>;
  pageMeta: QueueMeta;
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
  const [queue, setQueue] = useState<QueueResponse | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const fetches: Promise<Response>[] = [
          fetch("/api/admin/analytics/executive", { cache: "no-store" }),
          fetch("/api/admin/queue?page=1&pageSize=5", { cache: "no-store" })
        ];
        if (isSuperAdmin) {
          fetches.push(fetch("/api/admin/commercial/workflow", { cache: "no-store" }));
        }
        const results = await Promise.all(fetches);
        if (!results[0].ok) {
          setError("Could not load platform analytics.");
          return;
        }
        setAnalytics((await results[0].json()) as PlatformExecutiveAnalytics);
        if (results[1].ok) setQueue((await results[1].json()) as QueueResponse);
        if (isSuperAdmin && results[2]?.ok) setWorkflow((await results[2].json()) as WorkflowResponse);
      } catch {
        setError("Dashboard data failed to load.");
      }
    })();
  }, [isSuperAdmin]);

  const trendData = useMemo(
    () => analytics?.submissionTrend.weekly ?? [],
    [analytics]
  );

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

  const pendingTotal = useMemo(() => {
    if (!queue?.pageMeta) return 0;
    const m = queue.pageMeta;
    return m.pendingUsers.total + m.pendingSchools.total + m.pendingBrands.total;
  }, [queue]);

  if (error) return <p className="admin-alert admin-alert--error">{error}</p>;
  if (!analytics) {
    return (
      <div className="admin-loading">
        <div className="admin-loading__spinner" aria-hidden />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  const kpis = analytics.kpis.slice(0, 4);

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
        <time className="admin-page-head__time" dateTime={analytics.generatedAt}>
          Updated {new Date(analytics.generatedAt).toLocaleString("en-ZA")}
        </time>
      </header>

      {queue ? (
        <section className="admin-pending-strip" aria-label="Pending actions">
          <Link href="/dashboard/approvals" className="admin-pending-pill">
            <span className="admin-pending-pill__value">{queue.pageMeta.pendingSchools.total}</span>
            <span className="admin-pending-pill__label">Schools pending</span>
          </Link>
          <Link href="/dashboard/approvals" className="admin-pending-pill">
            <span className="admin-pending-pill__value">{queue.pageMeta.pendingBrands.total}</span>
            <span className="admin-pending-pill__label">Brands pending</span>
          </Link>
          <Link href="/dashboard/moderation" className="admin-pending-pill admin-pending-pill--warn">
            <span className="admin-pending-pill__value">{queue.pageMeta.openFraudFlags.total}</span>
            <span className="admin-pending-pill__label">Open fraud flags</span>
          </Link>
          <Link href="/dashboard/approvals" className="admin-pending-pill">
            <span className="admin-pending-pill__value">{pendingTotal}</span>
            <span className="admin-pending-pill__label">Total in queue</span>
          </Link>
        </section>
      ) : null}

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
            <h2>Submission trend</h2>
            <span className="admin-chart-card__meta">Weekly verified vs total</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
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
        </article>

        <article className="admin-chart-card">
          <div className="admin-chart-card__head">
            <h2>Transformation funnel</h2>
            <span className="admin-chart-card__meta">Participation stages</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.funnel}>
              <CartesianGrid stroke="#e8f0ff" strokeDasharray="4 4" />
              <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "#6b7c96" }} interval={0} angle={-12} textAnchor="end" height={56} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7c96" }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #dfebff" }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {analytics.funnel.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="admin-chart-grid admin-chart-grid--3">
        <article className="admin-chart-card">
          <div className="admin-chart-card__head">
            <h2>Verification channels</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={analytics.channelMix} dataKey="count" nameKey="channel" innerRadius={52} outerRadius={88} paddingAngle={2}>
                {analytics.channelMix.map((row, index) => (
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

      {isSuperAdmin && pipelineData.length > 0 ? (
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

      <section className="admin-bottom-grid">
        <article className="admin-chart-card">
          <div className="admin-chart-card__head">
            <h2>Brand impact rankings</h2>
            <Link href="/dashboard/analytics" className="admin-chart-card__link">
              Full analytics →
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.brandRankings.slice(0, 6)}>
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
