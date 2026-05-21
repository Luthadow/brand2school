import dotenv from "dotenv";
import { claimNextAuditExportJob, processAuditExportJob } from "../modules/admin/exportJobs.js";
import { prisma } from "../lib/prisma.js";

dotenv.config();
dotenv.config({ path: "apps/api/.env" });

const WORKER_NAME = process.env.AUDIT_EXPORT_WORKER_NAME ?? "audit-export-worker";
const POLL_MS = Number(process.env.AUDIT_EXPORT_POLL_MS ?? "5000");

async function runTick(): Promise<void> {
  const jobId = await claimNextAuditExportJob(WORKER_NAME);
  if (!jobId) return;
  await processAuditExportJob(jobId);
}

async function main(): Promise<void> {
  console.log(`[${WORKER_NAME}] started with poll interval ${POLL_MS}ms`);
  let shouldRun = true;
  process.on("SIGINT", () => {
    shouldRun = false;
  });
  process.on("SIGTERM", () => {
    shouldRun = false;
  });

  while (shouldRun) {
    try {
      await runTick();
    } catch (error) {
      console.error(`[${WORKER_NAME}] tick failed`, error);
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
