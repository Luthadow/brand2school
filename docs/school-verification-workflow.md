# School verification workflow (EMIS + evidence)

Governance-first school onboarding: principals submit an **EMIS number** and three evidence files; **SUPER_ADMIN** reviews the packet before entity status can advance past `PENDING`.

## Flow

1. **Register** — school created with `status: PENDING` and `SchoolVerification.status: NOT_SUBMITTED`.
2. **Submit packet** (school portal → Documents) — EMIS + principal ID + school letter + EMIS registry evidence (PDF/JPEG/PNG/WebP, max 5MB each).
3. **Ops notified** — email to `schools@brand2school.co.za` with admin review link.
4. **Admin review** — `/dashboard/schools/:id/verification` — approve, reject, or mark under review.
5. **Entity activation** — Approvals “Move Forward” is **blocked** until packet status is `APPROVED` (API enforces for `VERIFIED` / `APPROVED` / `ACTIVE`).

## API

| Method | Path | Role |
|--------|------|------|
| GET | `/api/v1/schools/verification` | SCHOOL_ADMIN |
| POST | `/api/v1/schools/verification/submit` | SCHOOL_ADMIN (multipart) |
| GET | `/api/v1/admin/school-verification/queue` | SUPER_ADMIN |
| GET | `/api/v1/admin/school-verification/:schoolId` | SUPER_ADMIN |
| PATCH | `/api/v1/admin/school-verification/:schoolId` | SUPER_ADMIN |

## Storage

Files: `uploads/schools/verification/{schoolId}/` served at `/uploads/schools/verification/…` (same pattern as commercial agreements).

## Database

Run migration: `20260519120000_school_verification` (adds `SchoolVerification` model + enum).

## Environment

- `ADMIN_WEB_APP_URL` — link in ops email (default `http://localhost:3001`).
