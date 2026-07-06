import type { NotificationJob } from "../../generated/prisma/index.js";
import { prisma } from "../prisma.js";
import { nextEsgRunAt } from "../../modules/analytics/esgScheduleUtils.js";
import { parseNotificationPayload } from "./payloads.js";

export async function finalizeEsgScheduleNotification(
  job: NotificationJob,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  if (job.template !== "ESG_REPORT") return;

  const payload = parseNotificationPayload("ESG_REPORT", job.payload);
  if (!payload.scheduleId) return;

  const schedule = await prisma.esgReportSchedule.findUnique({
    where: { id: payload.scheduleId }
  });
  if (!schedule) return;

  if (success) {
    await prisma.$transaction([
      prisma.esgReportDelivery.create({
        data: {
          scheduleId: schedule.id,
          status: "SENT",
          periodLabel: payload.periodLabel,
          sentAt: new Date()
        }
      }),
      prisma.esgReportSchedule.update({
        where: { id: schedule.id },
        data: {
          lastRunAt: new Date(),
          nextRunAt: nextEsgRunAt(schedule.cadence)
        }
      })
    ]);
    return;
  }

  await prisma.$transaction([
    prisma.esgReportDelivery.create({
      data: {
        scheduleId: schedule.id,
        status: "FAILED",
        periodLabel: payload.periodLabel,
        errorMessage: errorMessage ?? "ESG email delivery failed"
      }
    }),
    prisma.esgReportSchedule.update({
      where: { id: schedule.id },
      data: { nextRunAt: nextEsgRunAt(schedule.cadence) }
    })
  ]);
}
