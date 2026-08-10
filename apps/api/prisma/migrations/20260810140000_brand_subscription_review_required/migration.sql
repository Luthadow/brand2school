-- Founding-partner pilot expiry → case-study / conversion review (not payment past-due).
ALTER TYPE "BrandSubscriptionStatus" ADD VALUE IF NOT EXISTS 'REVIEW_REQUIRED';
