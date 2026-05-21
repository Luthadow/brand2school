import dotenv from "dotenv";
import { processSubscriptionGovernance } from "../modules/commercial/subscriptionGovernance.js";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";

dotenv.config();
dotenv.config({ path: "apps/api/.env" });

/** Default: every hour. */
const POLL_MS = Number(process.env.SUBSCRIPTION_GOVERNANCE_POLL_MS ?? "3600000");

async function main(): Promise<void> {
  logger.info({ pollMs: POLL_MS }, "Subscription governance worker started");
  let shouldRun = true;
  process.on("SIGINT", () => {
    shouldRun = false;
  });
  process.on("SIGTERM", () => {
    shouldRun = false;
  });

  while (shouldRun) {
    try {
      const result = await processSubscriptionGovernance();
      if (result.markedPastDue > 0 || result.suspended > 0) {
        logger.info(result, "Subscription governance tick");
      }
    } catch (error) {
      logger.error({ err: error }, "Subscription governance tick failed");
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
