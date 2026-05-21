-- Run in Railway Postgres → Query if P3009 blocks deploy and CLI resolve is unavailable.
-- Then redeploy with pre-deploy: npm run railway:migrate

UPDATE "_prisma_migrations"
SET
  "rolled_back_at" = NOW(),
  "finished_at" = NULL,
  "logs" = 'Manually marked rolled back (P3009 recovery)'
WHERE "migration_name" = '20260521180000_commercial_workflow_expiry'
  AND "finished_at" IS NULL;
