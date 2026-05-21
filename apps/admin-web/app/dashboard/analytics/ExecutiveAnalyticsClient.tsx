"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { PlatformExecutiveAnalytics } from "../../../lib/executiveAnalytics";

const COLORS = ["#003b8e", "#6cc24a", "#f7931e", "#4da3ff", "#002a66", "#dc2626"];

export function ExecutiveAnalyticsClient(): JSX.Element {
  const [data, setData] = useState<PlatformExecutiveAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trendMode, setTrendMode] = useState<"daily" | "weekly" | "monthly">("weekly");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/analytics/executive", { cache: "no-store" });
      if (!res.ok) {
        setError("Unable to load executive analytics.");
        return;
      }
      setData((await res.json()) as PlatformExecutiveAnalytics);
    })();
  }, []);

  const trendData = useMemo(() => {
    if (!data) return [];
    return data.submissionTrend[trendMode];
  }, [data, trendMode]);

  if (error) return <p>{error}</p>;
  if (!data) return <p>Loading executive analytics…</p>;

  return (
    <div className="exec-analytics">
      <header className="exec-analytics__head">
        <h1>Executive Intelligence</h1>
        <p>ESG + infrastructure credibility engine — trust, measurable impact, and national scale.</p>
        <small>Updated {new Date(data.generatedAt).toLocaleString("en-ZA")}</small>
      </header>

      <section className="exec-kpi-grid">
        {data.kpis.map((kpi) => (
          <article key={kpi.key} className="exec-kpi-card">
            <strong>{kpi.format === "percent" ? `${kpi.value}%` : kpi.value.toLocaleString("en-ZA")}</strong>
            <span>{kpi.label}</span>
            {typeof kpi.trendPercent === "number" ? (
              <small>{kpi.trendPercent >= 0 ? "+" : ""}{kpi.trendPercent}% vs prior month</small>
            ) : null}
          </article>
        ))}
      </section>

      <section className="card">
        <h2>Submission trend</h2>
        <div className="exec-tabs">
          {(["daily", "weekly", "monthly"] as const).map((mode) => (
            <button key={mode} type="button" className={trendMode === mode ? "active" : ""} onClick={() => setTrendMode(mode)}>
              {mode}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="verified" stroke="#6cc24a" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="total" stroke="#003b8e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="exec-two-col">
        <article className="card">
          <h2>Infrastructure progress</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.infrastructureProgress} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="category" width={110} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="progressPercent" fill="#003b8e" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
        <article className="card">
          <h2>Province distribution</h2>
          <div className="exec-province-grid">
            {data.provinces.map((province) => (
              <div
                key={province.code}
                className="exec-province"
                style={{ opacity: Math.max(0.35, province.intensity / 100) }}
                title={`${province.name}: ${province.submissions} submissions`}
              >
                <strong>{province.code}</strong>
                <span>{province.submissions}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="exec-two-col">
        <article className="card">
          <h2>Brand contribution rankings</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.brandRankings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="brandName" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="impactScore" fill="#6cc24a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
        <article className="card">
          <h2>Transformation funnel</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.funnel}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#003b8e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="card">
        <h2>Campaign performance</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="exec-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Brand</th>
                <th>Submissions</th>
                <th>Verification</th>
                <th>Fraud rate</th>
                <th>Engagement</th>
                <th>Conversion</th>
              </tr>
            </thead>
            <tbody>
              {data.campaignPerformance.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.brandName}</td>
                  <td>{row.submissions}</td>
                  <td>{row.verificationRate}%</td>
                  <td>{row.fraudRate}%</td>
                  <td>{row.engagementRate}%</td>
                  <td>{row.conversionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="exec-two-col">
        <article className="card">
          <h2>Fraud detection trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.fraudTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="blocked" stroke="#dc2626" strokeWidth={2} />
              <Line type="monotone" dataKey="duplicates" stroke="#f7931e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </article>
        <article className="card">
          <h2>Verification channels</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.channelMix} dataKey="count" nameKey="channel" innerRadius={50} outerRadius={90}>
                {data.channelMix.map((row, index) => (
                  <Cell key={row.channel} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="card">
        <h2>Live platform movement</h2>
        <ul className="exec-feed">
          {data.liveFeed.map((item) => (
            <li key={`${item.createdAt}-${item.message}`}>
              <span>✔ {item.message}</span>
              <time>{new Date(item.createdAt).toLocaleString("en-ZA")}</time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
