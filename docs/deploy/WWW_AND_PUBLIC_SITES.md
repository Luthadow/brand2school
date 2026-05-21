# www.brand2school.co.za — public website setup

Canonical public URL: **https://www.brand2school.co.za**  
Also served: **https://app.brand2school.co.za** (same Railway **web** service)

API stays at **https://api.brand2school.co.za** (service `brand2school`).

---

## Part A — Railway: create **web** service

1. Project **abundant-grace** → **+ New** → **GitHub Repo** → `Luthadow/brand2school`.
2. Rename service to **`web`**.

### Deploy settings

| Field | Value |
|-------|--------|
| **Root Directory** | *(empty)* |
| **Build command** | `npm run build -w @brand2school/web` |
| **Start command** | `npm run start -w @brand2school/web` |
| **Pre-deploy** | *(empty)* |
| **Healthcheck path** | `/` |

### Variables (required)

| Variable | Value |
|----------|--------|
| `NIXPACKS_CONFIG_FILE` | `nixpacks.web.toml` |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.brand2school.co.za` |
| `B2S_INTERNAL_API_KEY` | *exact same value as API `INTERNAL_API_KEY`* |

`NEXT_PUBLIC_*` must be set **before** build (Railway injects at build time).

### Custom domains (Networking)

Add **both** to the **web** service:

- `www.brand2school.co.za`
- `app.brand2school.co.za`

Copy the Railway target hostname (e.g. `web-production-xxxx.up.railway.app`) for Cloudflare.

**Deploy** → wait until **Online**.

---

## Part B — Railway: update **API** (`brand2school`)

**Variables** (add or update):

| Variable | Value |
|----------|--------|
| `WEB_APP_URL` | `https://www.brand2school.co.za` |
| `ADMIN_WEB_APP_URL` | `https://admin.brand2school.co.za` |
| `INTERNAL_API_KEY` | *(must match web `B2S_INTERNAL_API_KEY`)* |

**Redeploy** API after changing variables.

### Seed (once, if not done)

Run on **brand2school**:

```bash
npm run railway:seed
```

---

## Part C — Railway: create **admin-web** service

1. **+ New** → same repo → name **`admin-web`**.

| Field | Value |
|-------|--------|
| Build | `npm run build -w @brand2school/admin-web` |
| Start | `npm run start -w @brand2school/admin-web` |
| `NIXPACKS_CONFIG_FILE` | `nixpacks.admin.toml` |
| Healthcheck | `/login` |

**Variables:**

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.brand2school.co.za` |

**Custom domain:** `admin.brand2school.co.za` → **Deploy**.

---

## Part D — Cloudflare DNS

Dashboard → **DNS** → **Records**:

| Type | Name | Content / Target | Proxy |
|------|------|------------------|-------|
| CNAME | `www` | Railway hostname for **web** service | Proxied |
| CNAME | `app` | *same* **web** Railway hostname | Proxied |
| CNAME | `api` | Railway hostname for **brand2school** (API) | Proxied |
| CNAME | `admin` | Railway hostname for **admin-web** | Proxied |

### Apex `brand2school.co.za` (optional)

**Rules** → **Redirect Rules** (or Page Rule):

- If host equals `brand2school.co.za` → redirect to `https://www.brand2school.co.za` (301)

Or CNAME `@` → **web** Railway host (proxied; Cloudflare flattening).

### SSL

**SSL/TLS** → **Full (strict)**.

### Cache

- **api** / **admin**: bypass cache (or Cache Rule).
- **www** / **app**: cache static assets only.

---

## Part E — Verify

```text
https://www.brand2school.co.za          → marketing / portals (HTML)
https://app.brand2school.co.za          → same site
https://api.brand2school.co.za/health   → JSON API
https://admin.brand2school.co.za/login  → admin login
```

Admin: `superadmin@brand2school.co.za` / `ChangeMe123!` (change after login).

DNS propagation: 5–60 minutes.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| www does not resolve | Add CNAME `www` in Cloudflare → **web** Railway host |
| www shows Railway 502 | **web** service not Online; check build logs |
| www builds API instead of Next | Set `NIXPACKS_CONFIG_FILE=nixpacks.web.toml` on **web** service |
| Live data empty on homepage | Set `B2S_INTERNAL_API_KEY` on **web** = API `INTERNAL_API_KEY` |
| API images broken | `NEXT_PUBLIC_API_BASE_URL` must be `https://api.brand2school.co.za` |

---

## URL map

```text
www.brand2school.co.za     →  web (public site)     ← open this in browser
app.brand2school.co.za     →  web (alias)
api.brand2school.co.za     →  brand2school (API)
admin.brand2school.co.za   →  admin-web
```
