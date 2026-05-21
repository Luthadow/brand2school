export type TrendPoint = {
  period: string;
  verified: number;
  total: number;
};

export type SubmissionTrendSeries = {
  daily: TrendPoint[];
  weekly: TrendPoint[];
  monthly: TrendPoint[];
};

type TrendRow = { createdAt: Date; state: string };

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function weekKey(date: Date): string {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start.toISOString().slice(0, 10);
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function bucketTrend(
  rows: TrendRow[],
  keyFn: (date: Date) => string,
  limit: number
): TrendPoint[] {
  const map = new Map<string, { verified: number; total: number }>();
  for (const row of rows) {
    const key = keyFn(row.createdAt);
    const bucket = map.get(key) ?? { verified: 0, total: 0 };
    bucket.total += 1;
    if (row.state === "VALID") bucket.verified += 1;
    map.set(key, bucket);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit)
    .map(([period, counts]) => ({ period, ...counts }));
}

export function buildSubmissionTrends(rows: TrendRow[]): SubmissionTrendSeries {
  return {
    daily: bucketTrend(rows, dayKey, 30),
    weekly: bucketTrend(rows, weekKey, 12),
    monthly: bucketTrend(rows, monthKey, 12)
  };
}

export function buildParticipationTrend(
  rows: Array<{ createdAt: Date; whatsappMsisdn: string | null }>
): Array<{ period: string; activeParticipants: number; repeatParticipants: number }> {
  const byWeek = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const participant = row.whatsappMsisdn?.trim();
    if (!participant) continue;
    const week = weekKey(row.createdAt);
    const participants = byWeek.get(week) ?? new Map<string, number>();
    participants.set(participant, (participants.get(participant) ?? 0) + 1);
    byWeek.set(week, participants);
  }

  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([period, participants]) => {
      const counts = [...participants.values()];
      return {
        period,
        activeParticipants: counts.length,
        repeatParticipants: counts.filter((c) => c > 1).length
      };
    });
}

export function buildFraudTrend(
  rows: Array<{ createdAt: Date; outcome: string }>
): Array<{ period: string; blocked: number; duplicates: number; flagged: number }> {
  const byWeek = new Map<string, { blocked: number; duplicates: number; flagged: number }>();

  for (const row of rows) {
    const period = weekKey(row.createdAt);
    const bucket = byWeek.get(period) ?? { blocked: 0, duplicates: 0, flagged: 0 };
    if (row.outcome === "DUPLICATE") bucket.duplicates += 1;
    else if (row.outcome === "FRAUD_BLOCKED" || row.outcome === "BRUTE_FORCE") bucket.blocked += 1;
    else if (row.outcome === "INVALID_PATTERN" || row.outcome === "CHECKSUM_FAILED") bucket.flagged += 1;
    byWeek.set(period, bucket);
  }

  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([period, counts]) => ({ period, ...counts }));
}
