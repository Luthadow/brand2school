"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { PublicCampaignPerformanceRow } from "../../lib/platformCredibility";
import { formatCount } from "../../lib/formatCount";
import { CHART_COLORS } from "../analytics/charts/chartTheme";

export function CampaignPerformancePanel({
  rows
}: {
  rows: PublicCampaignPerformanceRow[];
}): JSX.Element {
  if (rows.length === 0) {
    return (
      <p className="lp-live-empty">
        Campaign performance analytics appear here as brand partners launch verified missions on Brand2School.
      </p>
    );
  }

  const chartRows = rows.slice(0, 8).map((row) => ({
    name: row.name.length > 18 ? `${row.name.slice(0, 16)}…` : row.name,
    verificationRate: row.verificationRate,
    engagementRate: row.engagementRate,
    conversionRate: row.conversionRate
  }));

  return (
    <div className="lp-campaign-performance">
      <div className="lp-campaign-performance-chart">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2eaf5" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={56} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => [`${value}%`, ""]} />
            <Legend />
            <Bar dataKey="verificationRate" name="Verification" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} />
            <Bar dataKey="engagementRate" name="Code engagement" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
            <Bar dataKey="conversionRate" name="Target conversion" fill={CHART_COLORS.orange} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="lp-campaign-performance-table-wrap">
        <table className="lp-campaign-performance-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Brand</th>
              <th>Submissions</th>
              <th>Verified</th>
              <th>Engagement</th>
              <th>Conversion</th>
              <th>Schools</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/campaigns/${row.slug}` as Route} className="lp-campaign-performance-link">
                    {row.name}
                  </Link>
                </td>
                <td>{row.brandName}</td>
                <td>{formatCount(row.submissions)}</td>
                <td>{row.verificationRate}%</td>
                <td>{row.engagementRate}%</td>
                <td>{row.conversionRate}%</td>
                <td>{formatCount(row.schoolsParticipating)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
