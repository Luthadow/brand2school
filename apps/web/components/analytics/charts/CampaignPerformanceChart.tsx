"use client";

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
import type { CampaignMetric } from "../../../lib/analytics";
import { CHART_COLORS, chartMargin } from "./chartTheme";

export function CampaignPerformanceChart({ campaigns }: { campaigns: CampaignMetric[] }): JSX.Element {
  const rows = campaigns.slice(0, 10).map((campaign) => {
    const verificationRate =
      campaign.submissions > 0
        ? Math.round((campaign.validSubmissions / campaign.submissions) * 1000) / 10
        : 100;
    const fraudRate =
      campaign.submissions > 0
        ? Math.round(((campaign.submissions - campaign.validSubmissions) / campaign.submissions) * 1000) / 10
        : 0;

    return {
      name: campaign.name.length > 16 ? `${campaign.name.slice(0, 14)}…` : campaign.name,
      verificationRate,
      engagementRate: campaign.codeUtilization,
      fraudRate
    };
  });

  if (rows.length === 0) {
    return <p className="ba-panel-sub">Campaign performance charts populate when campaigns receive submissions.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={rows} margin={{ ...chartMargin, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2eaf5" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-16} textAnchor="end" height={48} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value) => [`${value}%`, ""]} />
        <Legend />
        <Bar dataKey="verificationRate" name="Verification rate" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} />
        <Bar dataKey="engagementRate" name="Code engagement" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
        <Bar dataKey="fraudRate" name="Rejection rate" fill={CHART_COLORS.danger} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
