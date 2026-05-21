/**
 * Wait until PostgreSQL accepts connections (used by ops:bootstrap / db:up).
 * Reads DATABASE_URL from apps/api/.env or environment.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, "apps", "api", ".env");

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (!existsSync(envPath)) {
    console.error("Missing DATABASE_URL. Copy apps/api/.env.example to apps/api/.env");
    process.exit(1);
  }
  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith("DATABASE_URL="));
  if (!line) {
    console.error("DATABASE_URL not found in apps/api/.env");
    process.exit(1);
  }
  return line.slice("DATABASE_URL=".length).replace(/^["']|["']$/g, "");
}

function parseHostPort(url) {
  try {
    const u = new URL(url.replace(/^postgresql:/, "postgres:"));
    return { host: u.hostname || "localhost", port: Number(u.port || 5432) };
  } catch {
    return { host: "localhost", port: 5432 };
  }
}

function portOpen(host, port) {
  const net = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `(Test-NetConnection ${host} -Port ${port} -WarningAction SilentlyContinue).TcpTestSucceeded`
    ],
    { encoding: "utf8", shell: false }
  );
  return net.stdout?.trim() === "True";
}

function dockerPgReady() {
  const probe = spawnSync(
    "docker",
    ["exec", "brand2school-postgres", "pg_isready", "-U", "brand2school", "-d", "brand2school"],
    { encoding: "utf8", shell: process.platform === "win32" }
  );
  return probe.status === 0;
}

const maxAttempts = Number(process.env.DB_WAIT_ATTEMPTS ?? 60);
const intervalMs = Number(process.env.DB_WAIT_INTERVAL_MS ?? 2000);
const { host, port } = parseHostPort(loadDatabaseUrl());

console.log(`Waiting for PostgreSQL at ${host}:${port} (max ${maxAttempts} attempts)...`);

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  if (dockerPgReady() || portOpen(host, port)) {
    console.log("PostgreSQL is ready.");
    process.exit(0);
  }

  if (attempt === maxAttempts) {
    console.error(`PostgreSQL not reachable at ${host}:${port} after ${maxAttempts} attempts.`);
    console.error("Start Docker Desktop, then: npm run db:up");
    process.exit(1);
  }

  await sleep(intervalMs);
}
