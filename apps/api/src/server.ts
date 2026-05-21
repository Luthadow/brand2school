import { env, logProductionReadinessWarnings } from "./config/env.js";
import { runDatabaseMigrations } from "./bootstrap/migrate.js";
import { app } from "./app.js";
import { logger } from "./lib/logger.js";

const port = Number(env.PORT);

app.listen(port, "0.0.0.0", () => {
  logger.info({ port, host: "0.0.0.0", nodeEnv: env.NODE_ENV }, "Brand2School API listening");

  if (env.NODE_ENV !== "production") return;

  logProductionReadinessWarnings();

  // Run after listen so Railway /health succeeds while migrate deploy runs.
  setImmediate(() => {
    try {
      runDatabaseMigrations();
    } catch (error) {
      logger.error({ err: error }, "Database migration failed (API still up; check DATABASE_URL)");
    }
  });
});
