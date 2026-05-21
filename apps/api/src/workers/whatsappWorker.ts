import dotenv from "dotenv";
import { prisma } from "../lib/prisma.js";
import { claimNextWhatsAppMessage, processWhatsAppMessage } from "../lib/whatsappQueue.js";

dotenv.config();
dotenv.config({ path: "apps/api/.env" });

const WORKER_NAME = process.env.WHATSAPP_WORKER_NAME ?? "whatsapp-worker";
const POLL_MS = Number(process.env.WHATSAPP_QUEUE_POLL_MS ?? "3000");

async function runTick(): Promise<void> {
  const id = await claimNextWhatsAppMessage();
  if (!id) return;
  await processWhatsAppMessage(id);
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
