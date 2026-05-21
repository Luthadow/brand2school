# Brand2School — PDF reports & email wrappers

You **do not** need to supply Word, Canva, or InDesign PDF templates. Reports are **generated in code** (`apps/api/src/modules/analytics/esgPdf.ts` via PDFKit) and attached to a **single branded HTML email** (`sendEsgReportEmail` in `apps/api/src/lib/mail.ts`).

What you *do* need: correct **assets**, **letterhead copy**, and **mailbox setup** (see [email-communication.md](email-communication.md)).

---

## What the platform sends today

| # | Type | Trigger | Email wrapper | PDF attachment |
|---|------|---------|---------------|----------------|
| **1** | **ESG / CSI impact report** | Scheduled (`WEEKLY` / `MONTHLY` / `QUARTERLY`) or brand dashboard **Export ESG Report** | Yes — from `noreply@` | Yes — A4 PDF |

There is **no** separate PDF for school registration, password reset, or contact forms.

---

## 1. Email wrapper (PDF delivery)

**Sender:** `noreply@brand2school.co.za` only.

**Cadence variants** (same body; subject changes):

| Schedule | Email subject |
|----------|----------------|
| Weekly | `Weekly ESG Impact Report — {Brand Name}` |
| Monthly | `Monthly ESG Impact Report — {Brand Name}` |
| Quarterly | `Quarterly ESG Impact Report — {Brand Name}` |

**Fixed copy** (already in code — edit `mail.ts` if you want different wording):

- **Preheader:** `{Cadence} impact report for {period}`
- **Title:** `{Cadence} ESG Impact Report`
- **Subtitle:** `For {Brand Name} · {reporting period}`
- **Body:** Report is attached; built from verified participation data.
- **Section “Report contents”:** Filename + use for board / CSI / stakeholders.
- **Section “Need help?”:** CTA → `brands@brand2school.co.za`
- **Footer:** Brand enquiries → `brands@brand2school.co.za`

**Attachment filename pattern:**

```text
brand2school-esg-{brand-slug}-{YYYY-MM-DD}.pdf
```

Campaign-specific downloads from the dashboard may use:

```text
brand2school-esg-{campaign-slug}-{YYYY-MM-DD}.pdf
brand2school-esg-national-{YYYY-MM-DD}.pdf
```

You do **not** need three separate email templates for weekly/monthly/quarterly — one layout, dynamic cadence label.

---

## 2. PDF document structure (built-in “template”)

Single layout; title depends on scope:

| Export | PDF title on cover |
|--------|-------------------|
| All campaigns (national) | `National Impact Report` |
| One campaign | `Campaign Report — {Campaign Name}` |

### Sections (in order)

1. **Letterhead** — logo + company block + blue banner  
2. **Cover title** — national or campaign  
3. **Executive summary** — reporting period, generated date, KPI grid  
4. **Province participation** — table (province, schools, learners, submissions)  
5. **Campaign performance** — per-campaign metrics  
6. **Compliance & data governance** — POPIA / fraud / verification bullets  
7. **Footer** (every page) — product line + company reg.

### Executive summary metrics (from live data)

- Valid submissions  
- Engagement rate (%)  
- Schools reached  
- Participation events  
- Fraud blocked  
- Code utilization (%)

### Compliance block (static copy in code)

- Verified school network events only  
- No personal learner data in report  
- POPIA-aligned handling + audit trails  
- Fraud stats (dynamic counts)  
- One code = one verified event  

To change legal/compliance wording, edit `drawCompliance()` in `esgPdf.ts`.

---

## 3. What you should provide (assets & copy)

| Item | Required? | Where it goes | Notes |
|------|-----------|---------------|--------|
| **Logo PNG** | Done | **`brand2school.png` at monorepo root** (workspace main folder) | Also used from `apps/web/public/brand2school.png` for the site and HTML emails (`WEB_APP_URL/brand2school.png`). ESG PDFs resolve the root file automatically. |
| **Letterhead / company block** | Yes (verify) | `apps/api/src/lib/company.ts` | Legal name, reg `2025 / 606307 / 07`, tax `9515726231`, registered office address |
| **Physical address** | Yes | Same | Boitekong address |
| **Phone / WhatsApp** | Yes | Same | `068 796 7963` (calls and WhatsApp) |
| **Product tagline** | Optional | Same footer | “A product of nkanyezi Tech Solutions” |
| **Brand colours** | Optional | `BRAND_BLUE` / `BRAND_GREEN` in `esgPdf.ts` | Default `#003B8E`, `#6CC24A` (matches website) |
| **Word/PDF template file** | **No** | — | Not used |
| **Separate weekly/monthly PDF designs** | **No** | — | Same PDF; period comes from analytics |

---

## 4. Register Domain / cPanel

- **No** auto-responder for PDF emails — delivery is **application-only** via SMTP (`noreply@`).
- Ensure `noreply@` can send **attachments** (standard on cPanel).
- Large PDFs: most hosts allow 10–25 MB; typical ESG PDF is well under 1 MB.

---

## 5. Railway variables (PDF-related)

```env
MAIL_FROM=noreply@brand2school.co.za
SMTP_HOST=mail.brand2school.co.za
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@brand2school.co.za
SMTP_PASS=<secret>
WEB_APP_URL=https://app.brand2school.co.za
```

`WEB_APP_URL` is used for **HTML email** logo URLs, not embedded in the PDF (PDF uses local logo file when present).

---

## 6. Optional future PDF types (not built yet)

If you want more report types later, each would need a new generator + optional email wrapper:

| Report | Audience | Status |
|--------|----------|--------|
| ESG / CSI brand impact | Brands / CSI | **Live** |
| School term summary | Principals | Not built |
| Campaign close-out one-pager | Brands | Partially covered by campaign PDF title |
| Admin audit export | Internal | Separate CSV/job, not PDF |

---

## Code map

| File | Role |
|------|------|
| `apps/api/src/modules/analytics/esgPdf.ts` | PDF layout & data |
| `apps/api/src/lib/mail.ts` | `sendEsgReportEmail` |
| `apps/api/src/lib/emailTemplate.ts` | HTML shell for email |
| `apps/api/src/modules/analytics/esgReportSchedule.ts` | Weekly/monthly/quarterly worker |
| `apps/api/src/modules/analytics/routes.ts` | On-demand PDF download API |
| `apps/web/.../esg-report/route.ts` | Brand portal PDF proxy |

---

## Checklist before go-live

- [x] `brand2school.png` at workspace root (required for production deploy from Railway monorepo root)  
- [ ] Letterhead details in `esgPdf.ts` match your CIPC registration  
- [ ] `noreply@` SMTP tested with a PDF attachment  
- [ ] Brand schedule `recipientEmail` set per brand in admin  
- [ ] Export once from brand dashboard and open PDF on desktop + phone  
