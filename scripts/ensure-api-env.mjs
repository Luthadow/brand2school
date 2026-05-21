/**
 * Ensure apps/api/.env exists (copy from .env.example if missing).
 */
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const example = path.join(root, "apps", "api", ".env.example");
const envFile = path.join(root, "apps", "api", ".env");

if (existsSync(envFile)) {
  process.exit(0);
}

if (!existsSync(example)) {
  console.error("Missing apps/api/.env.example");
  process.exit(1);
}

copyFileSync(example, envFile);
console.log("Created apps/api/.env from .env.example — update secrets before production.");
