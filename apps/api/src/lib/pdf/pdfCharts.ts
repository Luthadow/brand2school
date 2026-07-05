import type PDFDocument from "pdfkit";

export const CHART_COLORS = ["#003B8E", "#6CC24A", "#F7931E", "#4DA3FF", "#0E9F6E", "#DC2626", "#7C3AED", "#0891B2"];

export type ChartPoint = {
  label: string;
  value: number;
  color?: string;
};

export type LineSeries = {
  name: string;
  color: string;
  points: ChartPoint[];
};

type ChartBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function truncateLabel(label: string, max = 10): string {
  const clean = label.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

function maxValue(values: number[], floor = 1): number {
  return Math.max(floor, ...values, 1);
}

function drawChartFrame(doc: InstanceType<typeof PDFDocument>, box: ChartBox): void {
  doc
    .rect(box.x, box.y, box.width, box.height)
    .strokeColor("#E5E7EB")
    .lineWidth(0.5)
    .stroke();
}

export function drawVerticalBarChart(
  doc: InstanceType<typeof PDFDocument>,
  box: ChartBox,
  data: ChartPoint[],
  options?: { title?: string; valueSuffix?: string }
): number {
  if (data.length === 0) return box.y;

  const padding = { top: options?.title ? 22 : 8, bottom: 28, left: 8, right: 8 };
  const plotX = box.x + padding.left;
  const plotY = box.y + padding.top;
  const plotW = box.width - padding.left - padding.right;
  const plotH = box.height - padding.top - padding.bottom;

  drawChartFrame(doc, box);

  if (options?.title) {
    doc.fontSize(10).fillColor("#003B8E").text(options.title, box.x + 8, box.y + 6, { width: box.width - 16 });
  }

  const max = maxValue(data.map((d) => d.value));
  const barGap = 6;
  const barW = Math.max(8, (plotW - barGap * (data.length - 1)) / data.length);

  data.forEach((point, i) => {
    const barH = Math.max(2, (point.value / max) * plotH);
    const x = plotX + i * (barW + barGap);
    const y = plotY + plotH - barH;
    doc.rect(x, y, barW, barH).fill(point.color ?? CHART_COLORS[i % CHART_COLORS.length]);

    if (point.value > 0) {
      doc
        .fontSize(7)
        .fillColor("#374151")
        .text(`${point.value}${options?.valueSuffix ?? ""}`, x, y - 10, { width: barW, align: "center" });
    }

    doc
      .fontSize(7)
      .fillColor("#6B7280")
      .text(truncateLabel(point.label, 8), x, plotY + plotH + 4, { width: barW + 4, align: "center" });
  });

  return box.y + box.height;
}

export function drawLineChart(
  doc: InstanceType<typeof PDFDocument>,
  box: ChartBox,
  series: LineSeries[],
  options?: { title?: string }
): number {
  const points = series[0]?.points ?? [];
  if (points.length === 0) return box.y;

  const padding = { top: options?.title ? 26 : 10, bottom: 28, left: 12, right: 12 };
  const plotX = box.x + padding.left;
  const plotY = box.y + padding.top;
  const plotW = box.width - padding.left - padding.right;
  const plotH = box.height - padding.top - padding.bottom;

  drawChartFrame(doc, box);

  if (options?.title) {
    doc.fontSize(10).fillColor("#003B8E").text(options.title, box.x + 8, box.y + 6, { width: box.width - 16 });
  }

  const allValues = series.flatMap((s) => s.points.map((p) => p.value));
  const max = maxValue(allValues);

  for (let i = 0; i <= 4; i += 1) {
    const gy = plotY + (plotH / 4) * i;
    doc
      .moveTo(plotX, gy)
      .lineTo(plotX + plotW, gy)
      .strokeColor("#F3F4F6")
      .lineWidth(0.5)
      .stroke();
  }

  series.forEach((s, seriesIndex) => {
    if (s.points.length === 0) return;
    const step = s.points.length > 1 ? plotW / (s.points.length - 1) : 0;

    doc.strokeColor(s.color).lineWidth(2);
    s.points.forEach((point, i) => {
      const x = plotX + i * step;
      const y = plotY + plotH - (point.value / max) * plotH;
      if (i === 0) doc.moveTo(x, y);
      else doc.lineTo(x, y);
    });
    doc.stroke();

    const legendY = box.y + box.height - 14;
    const legendX = box.x + 8 + seriesIndex * 100;
    doc.circle(legendX, legendY - 2, 3).fill(s.color);
    doc.fontSize(7).fillColor("#374151").text(s.name, legendX + 6, legendY - 6);
  });

  const labelStep = Math.max(1, Math.ceil(points.length / 6));
  points.forEach((point, i) => {
    if (i % labelStep !== 0 && i !== points.length - 1) return;
    const x = plotX + (points.length > 1 ? (plotW / (points.length - 1)) * i : 0);
    doc
      .fontSize(6)
      .fillColor("#6B7280")
      .text(truncateLabel(point.label, 9), x - 12, plotY + plotH + 4, { width: 28, align: "center" });
  });

  return box.y + box.height;
}

export function drawHorizontalBarChart(
  doc: InstanceType<typeof PDFDocument>,
  box: ChartBox,
  data: ChartPoint[],
  options?: { title?: string; maxValue?: number; showPercent?: boolean }
): number {
  if (data.length === 0) return box.y;

  const padding = { top: options?.title ? 24 : 10, bottom: 8, left: 4, right: 12 };
  const plotX = box.x + padding.left;
  const plotY = box.y + padding.top;
  const plotW = box.width - padding.left - padding.right;
  const rowH = Math.min(18, (box.height - padding.top - padding.bottom) / data.length);

  drawChartFrame(doc, box);

  if (options?.title) {
    doc.fontSize(10).fillColor("#003B8E").text(options.title, box.x + 8, box.y + 6, { width: box.width - 16 });
  }

  const max = options?.maxValue ?? maxValue(data.map((d) => d.value));

  data.forEach((point, i) => {
    const y = plotY + i * rowH;
    const labelW = Math.min(100, plotW * 0.35);
    const barW = plotW - labelW - 28;
    const fillW = Math.max(2, (point.value / max) * barW);

    doc.fontSize(8).fillColor("#374151").text(truncateLabel(point.label, 14), plotX, y + 2, { width: labelW });
    doc.rect(plotX + labelW, y + 3, barW, rowH - 8).fillColor("#F3F4F6").fill();
    doc
      .rect(plotX + labelW, y + 3, fillW, rowH - 8)
      .fill(point.color ?? CHART_COLORS[i % CHART_COLORS.length]);
    doc
      .fontSize(7)
      .fillColor("#374151")
      .text(
        options?.showPercent ? `${Math.round(point.value)}%` : String(point.value),
        plotX + labelW + barW + 4,
        y + 3,
        { width: 24 }
      );
  });

  return box.y + box.height;
}

export function drawStackedBarChart(
  doc: InstanceType<typeof PDFDocument>,
  box: ChartBox,
  segments: ChartPoint[],
  options?: { title?: string }
): number {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return box.y;

  drawChartFrame(doc, box);

  if (options?.title) {
    doc.fontSize(10).fillColor("#003B8E").text(options.title, box.x + 8, box.y + 6, { width: box.width - 16 });
  }

  const barY = box.y + (options?.title ? 28 : 12);
  const barX = box.x + 12;
  const barW = box.width - 24;
  const barH = 22;
  let cursor = barX;

  segments.forEach((seg, i) => {
    const segW = (seg.value / total) * barW;
    if (segW < 1) return;
    doc.rect(cursor, barY, segW, barH).fill(seg.color ?? CHART_COLORS[i % CHART_COLORS.length]);
    cursor += segW;
  });

  let legendY = barY + barH + 10;
  segments.forEach((seg, i) => {
    if (seg.value <= 0) return;
    doc.rect(box.x + 12, legendY, 8, 8).fill(seg.color ?? CHART_COLORS[i % CHART_COLORS.length]);
    doc
      .fontSize(7)
      .fillColor("#374151")
      .text(`${truncateLabel(seg.label, 18)} (${seg.value})`, box.x + 24, legendY - 1);
    legendY += 12;
  });

  return box.y + box.height;
}

export function drawStatusBreakdownChart(
  doc: InstanceType<typeof PDFDocument>,
  box: ChartBox,
  segments: ChartPoint[],
  options?: { title?: string }
): number {
  return drawStackedBarChart(doc, box, segments.filter((s) => s.value > 0), options);
}

export function chartBox(doc: InstanceType<typeof PDFDocument>, height = 150): ChartBox {
  return {
    x: 48,
    y: doc.y,
    width: doc.page.width - 96,
    height
  };
}

export function advanceAfterChart(doc: InstanceType<typeof PDFDocument>, bottomY: number, gap = 14): void {
  doc.y = bottomY + gap;
}
