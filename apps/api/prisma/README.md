# Prisma / PostgreSQL

Schema: `schema.prisma`  
Feature map: `docs/schema-nervous-system.md`

## Apply all migrations (required on every environment)

```bash
# From repo root
npm run db:migrate:deploy -w @brand2school/api
```

May 2026 migrations (in order):

1. `20260525100000_brand_home_sort_order`
2. `20260525110000_brand_founder_exempt`
3. `20260525120000_whatsapp_conversation`
4. `20260525130000_brand_verification_code`
5. `20260525140000_brand_verification_wiring`
6. `20260525150000_school_participation_indexes`

**Code file upload** (Excel/CSV/Word) uses existing `CodeBatch` and `Code` tables — no extra migration.

## After migrate (production once)

```bash
npm run brand:backfill-verification
npm run railway:bootstrap-founder
```

## Validate schema (no DB required)

```bash
npx prisma validate
```
