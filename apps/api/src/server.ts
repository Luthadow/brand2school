import { env, logProductionReadinessWarnings } from "./config/env.js";
import { app } from "./app.js";
import { ensureFounderBrandIfMissing } from "./bootstrap/ensureFounderBrand.js";
import { ensureSuperAdminIfMissing } from "./bootstrap/ensureSuperAdmin.js";
import { runPendingMigrations } from "./bootstrap/runMigrations.js";
import { logger } from "./lib/logger.js";
import { verifyMailOnStartup } from "./lib/smtpStartup.js";

const port = Number(env.PORT);

if (env.NODE_ENV === "production") {
  try {
    runPendingMigrations();
  } catch (err) {
    logger.fatal({ err }, "Database migrations failed on startup");
    process.exit(1);
  }
}

app.listen(port, "0.0.0.0", () => {
  logger.info({ port, host: "0.0.0.0", nodeEnv: env.NODE_ENV }, "Brand2School API listening");

  if (env.NODE_ENV === "production") {
    logProductionReadinessWarnings();
  }

  void ensureSuperAdminIfMissing();
  void ensureFounderBrandIfMissing();
  void verifyMailOnStartup();
});
