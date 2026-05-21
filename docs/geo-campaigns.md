# Geo-fenced campaign eligibility

Brand2School separates **code validity** (national inventory) from **campaign eligibility** (where impact is allocated).

## Principles

1. **Product codes stay national** — `B2S-…` codes remain valid across distribution; logistics are unpredictable.
2. **Campaigns carry eligibility rules** — provinces, districts, school clusters, and budget caps.
3. **School geography drives impact** — eligibility uses the **registered school's province and district**, not shopper GPS.
4. **Smart redirect, not harsh rejection** — ineligible submissions return alternatives; the code is **not consumed**.

## Campaign scope types

| `scopeType`      | Use case                          | Rules                                      |
|------------------|-----------------------------------|--------------------------------------------|
| `NATIONAL`       | All provinces                     | No geo filter                              |
| `PROVINCIAL`     | e.g. Gauteng package              | `allowedProvinces` — SA province codes     |
| `DISTRICT`       | Municipality / district targeting   | `allowedDistricts` — normalized names      |
| `SCHOOL_CLUSTER` | Named schools only                | `allowedSchoolIds`                         |

## Budget protection

- `budgetAllocatedZar` — optional cap (ZAR).
- `budgetConsumedZar` — incremented on each verified funding event.
- `pauseOnBudgetExhausted` — when true, campaign `isActive` flips false when consumed ≥ allocated.
- `overflowCampaignId` — optional link to a national / overflow campaign for messaging.

## Submission flow

```
Code submitted → school resolved → code verified → campaign eligibility → fraud → ledger
```

Ineligible outcomes (code **not** marked used):

- `GEO_INELIGIBLE` (422) — province/district/school mismatch + alternatives list.
- `BUDGET_EXHAUSTED` (409) — package budget reached + overflow hints.

## API

### Check before submit

`POST /api/v1/participation/eligibility-check`

```json
{
  "schoolName": "Example Primary",
  "district": "Tshwane",
  "campaignSlug": "gauteng-education-2026"
}
```

### Configure campaign (admin / brand)

`PATCH /api/v1/campaigns/:campaignId/eligibility`

```json
{
  "scopeType": "PROVINCIAL",
  "allowedProvinces": ["GP"],
  "budgetAllocatedZar": 500000,
  "overflowCampaignId": "<national-campaign-cuid>",
  "pauseOnBudgetExhausted": true
}
```

`GET /api/v1/campaigns/province-options` — province code list for admin UIs.

### Create campaign with rules

`POST /api/v1/campaigns` accepts the same eligibility fields.

## Monetization packages (commercial)

| Package          | Typical scope   | `scopeType`     |
|------------------|-----------------|-----------------|
| National         | All provinces   | `NATIONAL`      |
| Provincial       | 1+ provinces    | `PROVINCIAL`    |
| District         | Municipalities  | `DISTRICT`      |
| School cluster     | Named schools   | `SCHOOL_CLUSTER`|

Existing campaigns default to `NATIONAL` with no budget cap — backward compatible after migration `20260521120000_campaign_geo_eligibility`.

## Admin UI

**Admin console → Campaigns** (`/dashboard/campaigns`):

- Edit scope type, provinces, districts, school IDs
- Set budget cap and overflow national campaign
- Review **province nomination** leads (status workflow)

## Public surfaces

- Campaign cards show scope badges (e.g. **Gauteng only**)
- **Province nomination** form on homepage trust section, `/movement`, and non-national campaign pages
- `POST /api/v1/platform/province-nominations` (public)

Migrations: `20260521120000_campaign_geo_eligibility`, `20260521140000_province_nominations`.
