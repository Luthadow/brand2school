# Brand partners (all phases)

## Governance

Public visibility requires **ACTIVE** status plus admin approval:

| Surface | Requirements |
|---------|----------------|
| Homepage logo strip | `featuredOnHome` + `logoUrl` |
| Partner directory `/partners` | `publicProfileEnabled` or `featuredOnHome` |
| Partner profile `/partners/[slug]` | Same as directory |
| Campaign pages | Brand `ACTIVE`, campaign exists |

Deactivating a brand clears `featuredOnHome` and `publicProfileEnabled`.

Obtain written brand consent before enabling public logos (trademark policy).

## Admin workflow

1. Approve brand → **ACTIVE** (Approvals).
2. **Dashboard → Brands** — upload PNG logo (512×512 min, 2MB max).
3. Set **public slug**, description, website, brand color.
4. Enable **Public partner profile** and/or **Featured on homepage**.

## Public API

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/platform/partners` | Homepage featured logos |
| `GET /api/v1/platform/partners/directory` | Partner directory cards |
| `GET /api/v1/platform/partners/:slug` | Full partner profile + impact map |
| `GET /api/v1/platform/campaigns` | Campaign showcase list |
| `GET /api/v1/platform/campaigns/:slug` | Campaign detail |
| `GET /api/v1/platform/rankings` | School + partner rankings |
| `GET /api/v1/platform/trust` | Verification policy stats |

## Public web routes

| Route | Phase |
|-------|-------|
| `/partners` | 2 — directory |
| `/partners/[slug]` | 2 — profile, province map, campaigns |
| `/campaigns` | 2 — campaign gallery |
| `/campaigns/[slug]` | 2 — campaign detail |
| `/trust` | 2 — verification page |
| `/movement` | 3 — live data + rankings panel |

## Storage

- **Phase 1–2:** `apps/api/uploads/brands/{brandId}.png` served at `/uploads/brands/...`
- Set `API_PUBLIC_URL` in production (e.g. `https://api.brand2school.co.za`)
- **Phase 2+ (optional):** Cloudflare R2 — set `R2_*` env vars and add `@aws-sdk/client-s3` when ready

## Migrations

```bash
npm run db:migrate -w @brand2school/api
```

Applies `20260520120000_brand_partner_profile` and `20260520140000_brand_public_profiles`.
