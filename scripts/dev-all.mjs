import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const services = [
  { name: "api", command: "npm", args: ["run", "dev:api"] },
  { name: "web", command: "npm", args: ["run", "dev:web"] },
  { name: "admin", command: "npm", args: ["run", "dev:admin"] },
  { name: "whatsapp-worker", command: "npm", args: ["run", "dev:worker:whatsapp"] },
  { name: "esg-report-worker", command: "npm", args: ["run", "dev:worker:esg"] },
  { name: "audit-export-worker", command: "npm", args: ["run", "dev:worker:audit-export"] },
  { name: "notification-worker", command: "npm", args: ["run", "dev:worker:notifications"] },
  { name: "subscription-governance-worker", command: "npm", args: ["run", "dev:worker:subscriptions"] }
];

const children = services.map((service) => {
  const child = spawn(service.command, service.args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  child.on("exit", (code) => {
    console.error(`[dev:all] ${service.name} exited with code ${code ?? "unknown"}`);
    process.exit(code ?? 1);
  });
  return child;
});

function shutdown(): void {
  for (const child of children) {
    child.kill("SIGTERM");
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log(
  "[dev:all] Started API, web, admin, WhatsApp worker, ESG report worker, audit export worker, notification worker, and subscription governance worker."
);
