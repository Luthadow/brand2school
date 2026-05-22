# Demo login credentials

After running the database seed, use these accounts to explore the dashboards.

**Password (all demo users):** `ChangeMe123!`

> Run seed: `npm run db:seed -w @brand2school/api`  
> Production (Railway API shell): `npm run railway:seed`

---

## Super admin (platform admin)

| | |
|--|--|
| **URL (production)** | https://admin.brand2school.co.za/login |
| **URL (local)** | http://localhost:3001/login |
| **Email** | `superadmin@brand2school.co.za` |
| **Password** | `ChangeMe123!` |

Use this for approvals, brands, schools, campaigns, moderation, and commercial workflow.

---

## School portal (demo school)

| | |
|--|--|
| **URL (production)** | https://www.brand2school.co.za/school/login |
| **URL (local)** | http://localhost:3000/school/login |
| **Email** | `demo.school@brand2school.co.za` |
| **Password** | `ChangeMe123!` |
| **School** | Langa Secondary School (Demo) — code `LANGA-DEMO-GP` |

Dashboard: roadmap, needs, targets, submissions, profile.

---

## Brand partner portal (demo brand)

| | |
|--|--|
| **URL (production)** | https://www.brand2school.co.za/brand/login |
| **URL (local)** | http://localhost:3000/brand/login |
| **Email** | `demo.brand@brand2school.co.za` |
| **Password** | `ChangeMe123!` |
| **Brand** | Demo Beverage Partner (`DEMO` code prefix) |
| **Campaign** | Demo Back-to-School Essentials (`demo-back-to-school`) |

Dashboard: overview, campaigns, analytics, financials, agreement, reports.

`superadmin@brand2school.co.za` can also sign in at the brand login URL for support/testing.

---

## Troubleshooting “Invalid credentials”

If school or brand login returns **Invalid credentials** but the API is up:

1. Check readiness: `https://api.brand2school.co.za/health/ready`
   - `database: ok`, `schema: ok` — migrations applied.
   - `seed: run_db_seed` or `users: 0` — **demo data was never seeded** on that database.

2. **Seed production** (pick one):
   - **Railway API shell** (linked Postgres): `npm run railway:seed`
   - **From your machine** (needs API `INTERNAL_API_KEY` on Railway):
     ```bash
     set B2S_INTERNAL_API_KEY=your_railway_INTERNAL_API_KEY
     npm run railway:remote-seed
     ```

3. Retry login with password exactly `ChangeMe123!` (case-sensitive).

**Admin portal DNS:** `admin.brand2school.co.za` must have a Cloudflare CNAME to the Railway **admin-web** service. Until DNS exists, use the Railway admin URL from the dashboard.

---

## Security

- These accounts are for **demo and staging only**.
- Change `ChangeMe123!` after go-live, or delete demo users in production.
- Re-running seed resets passwords to `ChangeMe123!` for the emails above.
