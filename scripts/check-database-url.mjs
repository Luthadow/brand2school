const url = process.env.DATABASE_URL?.trim();

if (!url) {
  console.error(
    [
      "",
      "DATABASE_URL is missing or empty.",
      "",
      "Railway fix:",
      "  1. Add PostgreSQL to the project (+ New → Database → PostgreSQL).",
      "  2. Open the brand2school service → Variables.",
      "  3. Delete any empty DATABASE_URL row.",
      "  4. + New Variable → Variable Reference → select Postgres → DATABASE_URL.",
      "  5. Redeploy.",
      ""
    ].join("\n")
  );
  process.exit(1);
}
