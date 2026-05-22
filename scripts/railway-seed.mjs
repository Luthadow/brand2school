import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

execSync("node scripts/check-database-url.mjs", { stdio: "inherit", cwd: root, env: process.env });
execSync("npm run db:seed -w @brand2school/api", { stdio: "inherit", cwd: root, env: process.env });

console.log("");
console.log("Seed complete. Demo logins (password: ChangeMe123!):");
console.log("  Admin:  superadmin@brand2school.co.za  → https://admin.brand2school.co.za/login");
console.log("  School: demo.school@brand2school.co.za → https://www.brand2school.co.za/school/login");
console.log("  Brand:  demo.brand@brand2school.co.za  → https://www.brand2school.co.za/brand/login");
console.log("Full list: docs/DEMO_LOGINS.md");
