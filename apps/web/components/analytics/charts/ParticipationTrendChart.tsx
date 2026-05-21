"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BrandAnalytics } from "../../../lib/analytics";
import { CHART_COLORS, chartMargin } from "./chartTheme";

export function ParticipationTrendChart({
  rows
}: {
  rows: BrandAnalytics["participationTrend"];
}): JSX.Element {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={rows} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2eaf5" />
        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Area
          type="monotone"
          dataKey="activeParticipants"
          name="Active participants"
          stroke={CHART_COLORS.blue}
          fill={CHART_COLORS.blue}
          fillOpacity={0.2}
        />
        <Area
          type="monotone"
          dataKey="repeatParticipants"
          name="Repeat participants"
          stroke={CHART_COLORS.green}
          fill={CHART_COLORS.green}
          fillOpacity={0.25}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
