import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const src = join(process.cwd(), "src", "generated");
const dest = join(process.cwd(), "dist", "generated");

if (!existsSync(src)) {
  console.error("copy-prisma-client: missing", src, "(run prisma generate first)");
  process.exit(1);
}

cpSync(src, dest, { recursive: true });
console.log("copy-prisma-client: copied", src, "->", dest);
