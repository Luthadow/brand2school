import { prisma } from "../../lib/prisma.js";
import type { EsgReportCadence } from "../../generated/prisma/index.js";
import { buildEsgPdf } from "../analytics/esgPdf.js";
import { formatReportPeriod, getBrandAnalytics } from "../analytics/getBrandAnalytics.js";
import { queueEmail } from "../../lib/notifications/dispatch.js";
import { logger } from "../../lib/logger.js";
import { nextEsgRunAt } from "./esgScheduleUtils.js";

function cadenceLabel(cadence: EsgReportCadence): string {
  if (cadence === "WEEKLY") return "Weekly";
  if (cadence === "MONTHLY") return "Monthly";
  return "Quarterly";
}

export { nextEsgRunAt };

export async function processEsgReportSchedule(scheduleId: string): Promise<void> {
  const schedule = await prisma.esgReportSchedule.findUnique({
    where: { id: scheduleId },
    include: { brand: { select: { id: true, name: true } } }
  });
  if (!schedule || !schedule.enabled) return;

  const analytics = await getBrandAnalytics(undefined, schedule.brandId);
  const pdf = await buildEsgPdf(analytics);
  const periodLabel = formatReportPeriod(analytics);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `brand2school-esg-${schedule.brand.name.toLowerCase().replace(/\s+/g, "-")}-${stamp}.pdf`;

  try {
    await queueEmail({
      template: "ESG_REPORT",
      recipient: schedule.recipientEmail,
      entityType: "BRAND",
      entityId: schedule.brandId,
      priority: 3,
      metadata: { scheduleId: schedule.id, periodLabel },
      payload: {
        scheduleId: schedule.id,
        brandName: schedule.brand.name,
        cadence: cadenceLabel(schedule.cadence),
        periodLabel,
        filename,
        pdfBase64: pdf.toString("base64")
      }
    });

    logger.info({ scheduleId, brandId: schedule.brandId, cadence: schedule.cadence }, "ESG report email queued");
  } catch (error) {
    const message = error instanceof Error ? error.message : "ESG delivery failed";
    await prisma.$transaction([
      prisma.esgReportDelivery.create({
        data: {
          scheduleId: schedule.id,
          status: "FAILED",
          periodLabel,
          errorMessage: message
        }
      }),
      prisma.esgReportSchedule.update({
        where: { id: schedule.id },
        data: { nextRunAt: nextEsgRunAt(schedule.cadence) }
      })
    ]);
    logger.error({ scheduleId, err: error }, "ESG report queue failed");
  }
}

export async function processDueEsgReports(limit = 5): Promise<number> {
  const due = await prisma.esgReportSchedule.findMany({
    where: { enabled: true, nextRunAt: { lte: new Date() } },
    orderBy: { nextRunAt: "asc" },
    take: limit
  });

  for (const schedule of due) {
    await processEsgReportSchedule(schedule.id);
  }

  return due.length;
}
