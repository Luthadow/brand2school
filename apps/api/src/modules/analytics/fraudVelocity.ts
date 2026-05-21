export type SubmissionVelocityRow = {
  createdAt: Date;
  state: string;
  schoolId?: string;
  schoolProvince?: string;
};

export type FraudVelocitySnapshot = {
  submissionsLastHour: number;
  submissionsLast24Hours: number;
  avgVerifiedPerHour7d: number;
  velocityRatio: number;
  status: "normal" | "elevated" | "high";
  statusLabel: string;
  fraudCleanRatePercent: number;
  verificationRatePercent: number;
  flaggedOrRejectedLast24h: number;
  duplicateAttemptsLast24h: number;
};

const HOUR_MS = 60 * 60 * 1000;

export function computeFraudVelocitySnapshot(
  submissions: SubmissionVelocityRow[],
  attempts: Array<{ createdAt: Date; outcome: string }> = []
): FraudVelocitySnapshot {
  const now = Date.now();
  const hourAgo = now - HOUR_MS;
  const dayAgo = now - 24 * HOUR_MS;
  const weekAgo = now - 7 * 24 * HOUR_MS;

  const valid = submissions.filter((s) => s.state === "VALID");
  const total = submissions.length;
  const verified = valid.length;

  const lastHour = valid.filter((s) => s.createdAt.getTime() >= hourAgo).length;
  const last24h = valid.filter((s) => s.createdAt.getTime() >= dayAgo).length;
  const weekValid = valid.filter((s) => s.createdAt.getTime() >= weekAgo);
  const hoursInWeek = Math.max(1, (now - weekAgo) / HOUR_MS);
  const avgVerifiedPerHour7d = Math.round((weekValid.length / hoursInWeek) * 10) / 10;

  const velocityRatio =
    avgVerifiedPerHour7d > 0 ? Math.round((lastHour / avgVerifiedPerHour7d) * 100) / 100 : lastHour > 0 ? 2 : 0;

  let status: FraudVelocitySnapshot["status"] = "normal";
  let statusLabel = "Participation velocity within expected range.";
  if (velocityRatio >= 3 || lastHour >= 500) {
    status = "high";
    statusLabel = "Elevated participation velocity — enhanced fraud monitoring active.";
  } else if (velocityRatio >= 1.75 || lastHour >= 200) {
    status = "elevated";
    statusLabel = "Above-average participation velocity — additional verification sampling.";
  }

  const flaggedOrRejectedLast24h = submissions.filter(
    (s) => s.createdAt.getTime() >= dayAgo && s.state !== "VALID"
  ).length;

  const duplicateAttemptsLast24h = attempts.filter(
    (a) => a.createdAt.getTime() >= dayAgo && /duplicate/i.test(a.outcome)
  ).length;

  const fraudCleanRatePercent = total > 0 ? Math.round((verified / total) * 1000) / 10 : 100;
  const verificationRatePercent = fraudCleanRatePercent;

  return {
    submissionsLastHour: lastHour,
    submissionsLast24Hours: last24h,
    avgVerifiedPerHour7d,
    velocityRatio,
    status,
    statusLabel,
    fraudCleanRatePercent,
    verificationRatePercent,
    flaggedOrRejectedLast24h,
    duplicateAttemptsLast24h
  };
}

/** Province-level anomaly: unusually high valid submissions in 24h vs school count. */
export function detectSuspiciousProvinces(
  submissions: SubmissionVelocityRow[],
  windowHours = 24
): Array<{ province: string; submissions: number; schools: number; alert: boolean }> {
  const since = Date.now() - windowHours * HOUR_MS;
  const map = new Map<string, { submissions: number; schools: Set<string> }>();

  for (const row of submissions) {
    if (row.state !== "VALID" || row.createdAt.getTime() < since) continue;
    const province = row.schoolProvince?.trim() || "Unknown";
    const bucket = map.get(province) ?? { submissions: 0, schools: new Set() };
    bucket.submissions += 1;
    if (row.schoolId) bucket.schools.add(row.schoolId);
    map.set(province, bucket);
  }

  return [...map.entries()]
    .map(([province, stats]) => {
      const schools = stats.schools.size;
      const perSchool = schools > 0 ? stats.submissions / schools : stats.submissions;
      return {
        province,
        submissions: stats.submissions,
        schools,
        alert: perSchool >= 80 || (stats.submissions >= 200 && schools <= 2)
      };
    })
    .filter((r) => r.submissions > 0)
    .sort((a, b) => b.submissions - a.submissions)
    .slice(0, 9);
}
