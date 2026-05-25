-- Persist brand logos in PostgreSQL (Railway ephemeral disk loses uploads/brands/*.png on redeploy).
ALTER TABLE "Brand" ADD COLUMN "logoPng" BYTEA;
