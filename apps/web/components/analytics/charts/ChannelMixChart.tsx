"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { BrandAnalytics } from "../../../lib/analytics";
import { CHART_COLORS } from "./chartTheme";

export function ChannelMixChart({ rows }: { rows: BrandAnalytics["channelMix"] }): JSX.Element {
  const colors = [CHART_COLORS.green, CHART_COLORS.blue];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={rows} dataKey="count" nameKey="channel" innerRadius={48} outerRadius={88} paddingAngle={3}>
          {rows.map((row, index) => (
            <Cell key={row.channel} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value, _name, item) => [`${value} (${item.payload.sharePercent}%)`, "Submissions"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
