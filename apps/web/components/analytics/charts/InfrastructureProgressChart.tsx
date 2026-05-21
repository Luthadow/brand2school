"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BrandAnalytics } from "../../../lib/analytics";
import { CHART_COLORS, chartMargin } from "./chartTheme";

export function InfrastructureProgressChart({
  rows
}: {
  rows: BrandAnalytics["infrastructureProgress"];
}): JSX.Element {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={rows} layout="vertical" margin={{ ...chartMargin, left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2eaf5" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="category" width={110} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value) => [`${value}%`, "Progress"]} />
        <Bar dataKey="progressPercent" name="Progress" fill={CHART_COLORS.blue} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
