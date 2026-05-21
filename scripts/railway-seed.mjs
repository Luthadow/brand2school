import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

execSync("node scripts/check-database-url.mjs", { stdio: "inherit", cwd: root, env: process.env });
execSync("npm run db:seed -w @brand2school/api", { stdio: "inherit", cwd: root, env: process.env });

console.log("");
console.log("Seed complete. Super admin: superadmin@brand2school.co.za");
console.log("Default password: ChangeMe123! — change after first login.");
