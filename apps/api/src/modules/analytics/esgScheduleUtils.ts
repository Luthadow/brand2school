import type { EsgReportCadence } from "../../generated/prisma/index.js";

export function nextEsgRunAt(cadence: EsgReportCadence, from = new Date()): Date {
  const next = new Date(from);
  if (cadence === "WEEKLY") {
    next.setDate(next.getDate() + 7);
    return next;
  }
  if (cadence === "MONTHLY") {
    next.setMonth(next.getMonth() + 1);
    return next;
  }
  next.setMonth(next.getMonth() + 3);
  return next;
}
