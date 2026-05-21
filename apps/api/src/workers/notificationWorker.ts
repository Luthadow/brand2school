import dotenv from "dotenv";
import { processDueNotificationJobs } from "../lib/notifications/process.js";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";

dotenv.config();
dotenv.config({ path: "apps/api/.env" });

const POLL_MS = Number(process.env.NOTIFICATION_POLL_MS ?? "3000");

async function main(): Promise<void> {
  logger.info({ pollMs: POLL_MS }, "Notification worker started");
  let shouldRun = true;
  process.on("SIGINT", () => {
    shouldRun = false;
  });
  process.on("SIGTERM", () => {
    shouldRun = false;
  });

  while (shouldRun) {
    try {
      const processed = await processDueNotificationJobs();
      if (processed > 0) {
        logger.info({ processed }, "Notification worker tick complete");
      }
    } catch (error) {
      logger.error({ err: error }, "Notification worker tick failed");
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
