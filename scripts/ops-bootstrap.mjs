/**
 * Operational bootstrap: wait for Postgres, migrate, seed.
 * Usage: npm run ops:bootstrap
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("Brand2School ops bootstrap");

run("node", [path.join(root, "scripts", "ensure-api-env.mjs")]);
run("node", [path.join(root, "scripts", "wait-for-postgres.mjs")]);
run("npm", ["run", "db:generate", "-w", "@brand2school/api"]);
run("npm", ["run", "db:migrate:deploy", "-w", "@brand2school/api"]);
run("npm", ["run", "db:seed", "-w", "@brand2school/api"]);

console.log("\nBootstrap complete.");
console.log("Next: npm run dev:all");
console.log("Verify: npm run smoke:test (with API running on :4000)");
