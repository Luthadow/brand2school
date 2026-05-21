import dotenv from "dotenv";
import { processDueEsgReports } from "../modules/analytics/esgReportSchedule.js";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";

dotenv.config();
dotenv.config({ path: "apps/api/.env" });

const POLL_MS = Number(process.env.ESG_REPORT_POLL_MS ?? "60000");

async function main(): Promise<void> {
  logger.info({ pollMs: POLL_MS }, "ESG report worker started");
  let shouldRun = true;
  process.on("SIGINT", () => {
    shouldRun = false;
  });
  process.on("SIGTERM", () => {
    shouldRun = false;
  });

  while (shouldRun) {
    try {
      const processed = await processDueEsgReports();
      if (processed > 0) {
        logger.info({ processed }, "ESG report worker tick complete");
      }
    } catch (error) {
      logger.error({ err: error }, "ESG report worker tick failed");
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}

void main();
process.on("SIGINT", async () => {
  await prisma.$disconnect();
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
});
