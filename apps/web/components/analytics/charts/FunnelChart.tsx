"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BrandAnalytics } from "../../../lib/analytics";
import { CHART_COLORS, chartMargin } from "./chartTheme";

export function FunnelChart({ stages }: { stages: BrandAnalytics["funnel"] }): JSX.Element {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={stages} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2eaf5" />
        <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" name="Schools / campaigns" fill={CHART_COLORS.green} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
