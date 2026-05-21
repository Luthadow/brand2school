/** Commercial catalog — keep aligned with apps/api/src/modules/commercial/territorialPackages.ts */

export type TerritorialPackageId =
  | "SCHOOL_TRANSFORMATION"
  | "DISTRICT_TRANSFORMATION"
  | "PROVINCIAL_IMPACT"
  | "NATIONAL_TRANSFORMATION"
  | "GOVERNMENT_INSTITUTIONAL";

export type TerritorialPackage = {
  id: TerritorialPackageId;
  name: string;
  partnerTitle: string;
  idealFor: string;
  coverage: string;
  activationFee: string;
  monthlySubscription: string;
  recommendedContributionPool: string;
  scopeType: string;
  participation: string;
  focus: string;
  includes: string[];
  featured?: boolean;
};

export const COMMERCIAL_VALUE_STREAMS = {
  activationFee: {
    label: "Activation fee (one-time)",
    mandatory: true,
    description:
      "Enterprise onboarding, campaign setup, brand verification, code configuration, and platform activation. Required before public campaign visibility.",
    note: "Paid once. Non-refundable."
  },
  monthlySubscription: {
    label: "Monthly platform subscription (recurring)",
    mandatory: true,
    description:
      "Enterprise ESG infrastructure access — dashboards, reporting, fraud monitoring, analytics, hosting, and operational support. Not a donation.",
    includes: [
      "Dashboard & ESG reporting access",
      "Fraud monitoring & campaign verification",
      "Analytics infrastructure & operational support",
      "Hosting, reporting systems & platform maintenance"
    ],
    minimumCommitmentMonths: 12
  },
  contributionPool: {
    label: "Transformation contribution pool (optional)",
    mandatory: false,
    description:
      "Optional funding for school infrastructure — sanitation, water, electricity, digital access, fencing, and nutrition.",
    pitch:
      "Flexible contribution structure — monthly, quarterly, or annual — aligned to transformation phases."
  }
} as const;

export const COMMERCIAL_ROLLOUT_PHASES = [
  {
    phase: 1,
    title: "Phase 1 — Now",
    platformFee: "Activation fee + monthly subscription",
    contributionPool: "Optional — brand controls amount, phases & territory"
  },
  {
    phase: 2,
    title: "Phase 2 — Growth",
    platformFee: "Mandatory recurring subscription",
    contributionPool: "Recommended transformation commitment targets"
  },
  {
    phase: 3,
    title: "Phase 3 — Mature",
    platformFee: "Mandatory",
    contributionPool: "Contractual minimum impact allocations (after trust & case studies)"
  }
] as const;

export const INDUSTRY_PHASE_ALIGNMENT = [
  { infrastructurePhase: "Water Infrastructure", brandCategories: "Beverage companies" },
  { infrastructurePhase: "Digital Access", brandCategories: "Telecoms & technology" },
  { infrastructurePhase: "Nutrition", brandCategories: "Retail & FMCG" },
  { infrastructurePhase: "Electricity & Energy", brandCategories: "Energy providers" },
  { infrastructurePhase: "STEM & Innovation", brandCategories: "Technology & education partners" },
  { infrastructurePhase: "Sustainability", brandCategories: "Environmental & green initiatives" }
] as const;

export const CODE_CONTRIBUTION_MODEL = {
  description: "Each verified product code can contribute micro-amounts (e.g. R0.10 – R1.00) into the transformation pool.",
  note: "Participation-driven funding — consumers help scale infrastructure alongside brand campaigns."
} as const;

export const INFRASTRUCTURE_PHASE_TRACK = [
  "Phase 1 — Water & sanitation",
  "Phase 2 — Electricity & fencing",
  "Phase 3 — Digital access & devices",
  "Phase 4 — Libraries & laboratories",
  "Phase 5 — Smart learning infrastructure"
] as const;

export const PHASE_SPONSORSHIP_ADDONS = [
  { focus: "Water Partner", example: "Sanitation & water infrastructure" },
  { focus: "Digital Partner", example: "Devices, connectivity & labs" },
  { focus: "Nutrition Partner", example: "Feeding & nutrition programmes" },
  { focus: "Green Energy Partner", example: "Solar & efficient power" }
] as const;

export const COMMERCIAL_ADD_ON_SERVICES = [
  { service: "API Integration Support", cost: "From R35,000" },
  { service: "WhatsApp Integration Support", cost: "From R25,000" },
  { service: "AI Fraud Intelligence", cost: "From R25,000" },
  { service: "QR Packaging Integration", cost: "From R20,000" },
  { service: "Custom ESG Reporting", cost: "From R15,000" },
  { service: "Retail Activation Support", cost: "Custom" },
  { service: "Strategic ESG Consulting", cost: "Custom" },
  { service: "Public Media Campaign Support", cost: "Custom" }
] as const;

export const SUBSCRIPTION_LIFECYCLE = [
  { stage: "Active", action: "Full campaign functionality" },
  { stage: "Payment overdue", action: "Warning notifications" },
  { stage: "Grace period", action: "Limited access" },
  { stage: "Suspended", action: "Campaign participation paused" },
  { stage: "Reactivated", action: "Full access restored" }
] as const;

export const BILLING_WORKFLOW_STEPS = [
  "Brand registration — enterprise application",
  "Registration & participation guide email",
  "Verification & commercial review",
  "Participation agreement signed",
  "Activation invoice — activation fee + first subscription cycle",
  "Campaign configuration",
  "Campaign activation — publicly active"
] as const;

export const PREMIUM_POSITIONING = {
  tagline: "A measurable education infrastructure and ESG intelligence platform.",
  salesPitch:
    "Brand2School gives your organisation measurable, auditable, and publicly visible education-impact infrastructure reporting.",
  notPositioning: "A donation platform.",
  subscriptionPositioning: "Enterprise ESG infrastructure participation — not monthly donations.",
  justifies: [
    "Procurement, ESG, innovation, CSI, and sustainability budgets",
    "Activation fee separate from recurring subscription and optional transformation funding",
    "Phase sponsorship — own a category, not random donations",
    "Code-verified micro-contributions scale participation-driven impact"
  ]
} as const;

export const CONTRACT_PACKAGE_REQUIREMENTS = [
  { label: "Signed participation agreement" },
  { label: "POPIA compliance acceptance" },
  { label: "Campaign rules approval" },
  { label: "Verified activation fee & first subscription cycle" },
  { label: "Approved code upload or generation" },
  { label: "Brand verification review" }
] as const;

export const RECOMMENDED_PAYMENT_SCHEDULE = [
  {
    stage: "Activation fee",
    percentage: 100,
    note: "One-time EFT before campaign activation"
  },
  {
    stage: "First subscription cycle",
    percentage: 100,
    note: "Due with activation before public launch"
  },
  {
    stage: "Ongoing subscription",
    percentage: 100,
    note: "Recurring monthly ESG infrastructure access"
  }
] as const;

export const TERRITORIAL_PACKAGES: TerritorialPackage[] = [
  {
    id: "SCHOOL_TRANSFORMATION",
    name: "School Package",
    partnerTitle: "Official School Transformation Partner",
    idealFor: "Local businesses, SMEs, community partners",
    coverage: "One selected school — transformation territory",
    activationFee: "R10,000",
    monthlySubscription: "R3,000 – R8,000/month",
    recommendedContributionPool: "From R50,000+ (optional)",
    scopeType: "SCHOOL_CLUSTER",
    participation: "Unlimited participation for that school",
    focus: "Optional phase sponsorship aligned to your industry",
    includes: [
      "Activation: onboarding, verification & code setup",
      "Monthly ESG infrastructure for one school",
      "Optional transformation pool from R50,000"
    ]
  },
  {
    id: "DISTRICT_TRANSFORMATION",
    name: "District Package",
    partnerTitle: "Official District Transformation Partner",
    idealFor: "Regional retailers, franchises, district campaigns",
    coverage: "All schools in one district / municipality",
    activationFee: "R25,000",
    monthlySubscription: "R10,000 – R25,000/month",
    recommendedContributionPool: "From R500,000+ (optional)",
    scopeType: "DISTRICT",
    participation: "Unlimited submissions across district schools",
    focus: "District territory + optional phase ownership",
    includes: [
      "Activation: district campaign setup & codes",
      "Monthly ESG infrastructure: district ops & analytics",
      "Optional transformation pool from R500,000"
    ]
  },
  {
    id: "PROVINCIAL_IMPACT",
    name: "Provincial Package",
    partnerTitle: "Official Education Transformation Partner (Province)",
    idealFor: "Telecoms, banks, FMCG, major retailers",
    coverage: "All districts & schools in one province",
    activationFee: "R75,000",
    monthlySubscription: "R35,000 – R80,000/month",
    recommendedContributionPool: "From R500,000+ (optional)",
    scopeType: "PROVINCIAL",
    participation: "Unlimited verified submissions province-wide",
    focus: "Province-scale ESG intelligence",
    featured: true,
    includes: [
      "Activation: provincial territory & executive onboarding",
      "Monthly ESG infrastructure: heatmaps & account management",
      "Optional transformation pool — brand-controlled"
    ]
  },
  {
    id: "NATIONAL_TRANSFORMATION",
    name: "National Package",
    partnerTitle: "Official National Education Transformation Partner",
    idealFor: "Enterprise retailers, beverage & national brands",
    coverage: "All provinces, districts & schools nationally",
    activationFee: "R250,000+",
    monthlySubscription: "R100,000+/month",
    recommendedContributionPool: "From R2,000,000+ (optional)",
    scopeType: "NATIONAL",
    participation: "Unlimited national participation",
    focus: "National ESG intelligence & category ownership",
    includes: [
      "Activation: national enterprise onboarding",
      "Monthly ESG infrastructure: enterprise analytics & API",
      "Optional transformation pool from R2,000,000+"
    ]
  },
  {
    id: "GOVERNMENT_INSTITUTIONAL",
    name: "Government & Institutional",
    partnerTitle: "Public-Private Transformation Partner",
    idealFor: "Government, NGOs, development agencies",
    coverage: "Custom geographic targeting",
    activationFee: "Custom enterprise agreement",
    monthlySubscription: "Custom",
    recommendedContributionPool: "PPP / grant structured (optional)",
    scopeType: "NATIONAL",
    participation: "Custom framework",
    focus: "Multi-year programmes & national reporting",
    includes: [
      "Custom platform & compliance intelligence",
      "Transformation funding separate from platform fees"
    ]
  }
];

export function packageById(id: TerritorialPackageId): TerritorialPackage | undefined {
  return TERRITORIAL_PACKAGES.find((p) => p.id === id);
}
