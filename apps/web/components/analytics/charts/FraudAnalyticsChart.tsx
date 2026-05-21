"use client";

import {
  Area,
  AreaChart,
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
import type { BrandAnalytics } from "../../../lib/analytics";
import { CHART_COLORS, chartMargin } from "./chartTheme";

export function FraudAnalyticsChart({
  fraudTrend,
  fraudByOutcome
}: {
  fraudTrend: BrandAnalytics["fraudTrend"];
  fraudByOutcome: BrandAnalytics["trust"]["fraudByOutcome"];
}): JSX.Element {
  const pieData = fraudByOutcome.slice(0, 6).map((row) => ({
    name: row.outcome.replace(/_/g, " "),
    value: row.count
  }));
  const pieColors = [CHART_COLORS.danger, CHART_COLORS.orange, CHART_COLORS.blue, CHART_COLORS.muted, CHART_COLORS.sky, CHART_COLORS.navy];

  return (
    <div className="ba-chart-split">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={fraudTrend} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2eaf5" />
          <XAxis dataKey="period" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="blocked" stackId="1" stroke={CHART_COLORS.danger} fill={CHART_COLORS.danger} fillOpacity={0.35} />
          <Area type="monotone" dataKey="duplicates" stackId="1" stroke={CHART_COLORS.orange} fill={CHART_COLORS.orange} fillOpacity={0.35} />
          <Area type="monotone" dataKey="flagged" stackId="1" stroke={CHART_COLORS.blue} fill={CHART_COLORS.blue} fillOpacity={0.25} />
        </AreaChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
            {pieData.map((entry, index) => (
              <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
