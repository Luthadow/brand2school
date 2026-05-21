import { env, logProductionReadinessWarnings } from "./config/env.js";
import { runDatabaseMigrations } from "./bootstrap/migrate.js";
import { app } from "./app.js";
import { logger } from "./lib/logger.js";

if (env.NODE_ENV === "production") {
  logProductionReadinessWarnings();
  runDatabaseMigrations();
}

app.listen(Number(env.PORT), () => {
  logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, "Brand2School API listening");
});
