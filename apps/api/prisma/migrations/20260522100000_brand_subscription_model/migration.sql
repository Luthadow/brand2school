-- Brand recurring subscription model (activation fee + monthly ESG infrastructure access)

CREATE TYPE "BrandSubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'SUSPENDED');
CREATE TYPE "BrandSubscriptionPlan" AS ENUM ('SCHOOL', 'DISTRICT', 'PROVINCIAL', 'NATIONAL');
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

ALTER TABLE "Brand"
  ADD COLUMN "subscriptionStatus" "BrandSubscriptionStatus",
  ADD COLUMN "subscriptionPlan" "BrandSubscriptionPlan",
  ADD COLUMN "subscriptionStartDate" TIMESTAMP(3),
  ADD COLUMN "subscriptionEndDate" TIMESTAMP(3),
  ADD COLUMN "activationFeePaid" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "recurringAmountZar" DECIMAL(12,2),
  ADD COLUMN "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN "gracePeriodUntil" TIMESTAMP(3);
