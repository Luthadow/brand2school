/**
 * Full nervous-system verification: build → bootstrap DB → start API → smoke test.
 * Usage: npm run verify:nervous-system
 */
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_PORT = process.env.PORT ?? "4000";
const API_BASE = process.env.SMOKE_API_BASE ?? `http://localhost:${API_PORT}`;
const START_TIMEOUT_MS = 90_000;
const POLL_MS = 1500;

function run(command, args, opts = {}) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function waitForApi(): Promise<void> {
  const deadline = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) {
        const ready = await fetch(`${API_BASE}/health/ready`);
        if (ready.ok) {
          const body = await ready.json();
          if (body.ok) {
            console.log("\nAPI ready:", body.checks);
            return;
          }
        }
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  console.error(`API did not become ready at ${API_BASE} within ${START_TIMEOUT_MS / 1000}s`);
  process.exit(1);
}

console.log("Brand2School — nervous system verification\n");

run("npm", ["run", "build:all"]);

let postgresOk = true;
const waitPg = spawnSync("node", [path.join(root, "scripts", "wait-for-postgres.mjs")], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32"
});
if (waitPg.status !== 0) {
  console.warn("\n⚠ Postgres not reachable — skipping migrate/seed (API smoke may use demo fallbacks).\n");
  postgresOk = false;
}

if (postgresOk) {
  run("node", [path.join(root, "scripts", "ensure-api-env.mjs")]);
  run("npm", ["run", "db:generate", "-w", "@brand2school/api"]);
  run("npm", ["run", "db:migrate:deploy", "-w", "@brand2school/api"]);
  run("npm", ["run", "db:seed", "-w", "@brand2school/api"]);
}

const api = spawn("npm", ["run", "dev:api"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, PORT: API_PORT }
});

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(api.pid), "/f", "/t"], { stdio: "ignore", shell: true });
  } else {
    api.kill("SIGTERM");
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));

api.on("exit", (code) => {
  if (!shuttingDown) {
    console.error(`API exited unexpectedly with code ${code}`);
    shutdown(code ?? 1);
  }
});

await waitForApi();

const smoke = spawnSync("npm", ["run", "smoke:test", "-w", "@brand2school/api"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, SMOKE_API_BASE: API_BASE }
});

shutdown(smoke.status ?? 1);
