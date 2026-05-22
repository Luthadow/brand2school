# Super admin bootstrap

Production and local environments use **real registrations only** — no demo schools or brands are seeded.

## Super admin login

| | |
|--|--|
| **Admin URL** | Your Railway admin URL + `/login`, or `http://localhost:3001/login` locally |
| **Email** | `superadmin@brand2school.co.za` |
| **Password** | `ChangeMe123!` after local `npm run db:seed`, unless you set `BOOTSTRAP_SUPERADMIN_PASSWORD` on the API |

Change the password after first login in production.

## Local database

```bash
npm run db:seed -w @brand2school/api
```

This removes any legacy demo records, then creates/updates the super admin only.

## Production (Railway)

1. Set `INTERNAL_API_KEY` on the API service (32+ characters).
2. Remove old demo data (once):

```bash
B2S_API_URL=https://api.brand2school.co.za \
B2S_INTERNAL_API_KEY=<your_key> \
npm run railway:purge-demo
```

3. Ensure super admin exists:

```bash
npm run railway:bootstrap-admin
```

Or run both via Railway API shell:

```bash
npm run railway:purge-demo
npm run railway:seed
```

## What was removed

- Langa Secondary School (Demo) — `LANGA-DEMO-GP`
- Demo Beverage Partner — `DEMO` / `demo-beverage-partner`
- `demo.school@` and `demo.brand@` users
- Demo campaign `demo-back-to-school`

Real schools (e.g. registrations from the public form) are **not** deleted.
