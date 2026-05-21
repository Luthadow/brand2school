"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { BrandAnalytics } from "../../../lib/analytics";
import { CHART_COLORS, chartMargin } from "./chartTheme";

type TrendMode = "daily" | "weekly" | "monthly";

export function SubmissionTrendChart({
  trend
}: {
  trend: BrandAnalytics["submissionTrend"];
}): JSX.Element {
  const [mode, setMode] = useState<TrendMode>("weekly");
  const data = useMemo(() => trend[mode], [mode, trend]);

  return (
    <div className="ba-chart-wrap">
      <div className="ba-chart-tabs" role="tablist" aria-label="Submission trend period">
        {(["daily", "weekly", "monthly"] as TrendMode[]).map((item) => (
          <button
            key={item}
            type="button"
            className={`ba-chart-tab${mode === item ? " ba-chart-tab--active" : ""}`}
            onClick={() => setMode(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2eaf5" />
          <XAxis dataKey="period" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="verified" name="Verified" stroke={CHART_COLORS.green} strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="total" name="Total" stroke={CHART_COLORS.blue} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
