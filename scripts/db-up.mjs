/**
 * Start PostgreSQL via Docker Compose and wait until it accepts connections.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const composeFile = path.join(root, "infra", "docker", "docker-compose.yml");

function run(command, args) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("node", [path.join(root, "scripts", "ensure-api-env.mjs")]);

console.log("Starting Brand2School PostgreSQL...");

run("docker", ["compose", "-f", composeFile, "up", "-d", "postgres"]);
run("node", [path.join(root, "scripts", "wait-for-postgres.mjs")]);

console.log("\nPostgreSQL is up. Run: npm run ops:bootstrap");
