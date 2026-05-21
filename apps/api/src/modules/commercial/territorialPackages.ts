import type { BrandSubscriptionPlan, CampaignScopeType } from "../../generated/prisma/index.js";
import { serializeTransformationLicenseModel } from "./transformationLicense.js";

export function formatZar(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0
  }).format(amount);
}

/** Territorial impact rights — geographic transformation scope, not submission caps. */
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
  /** One-time activation fee — paid before campaign activation. */
  activationFeeZar: number;
  /** Monthly enterprise ESG infrastructure subscription (recurring). */
  monthlySubscriptionMinZar: number;
  monthlySubscriptionMaxZar: number | null;
  /** @deprecated Use activationFeeZar — kept for catalog serialization compat. */
  priceMinZar: number;
  /** @deprecated Use monthlySubscriptionMaxZar — kept for catalog serialization compat. */
  priceMaxZar: number | null;
  /** Optional transformation contribution pool — not required at onboarding. */
  recommendedContributionPoolZar: number | null;
  scopeType: CampaignScopeType;
  subscriptionPlan: BrandSubscriptionPlan;
  participation: string;
  focus: string;
  includes: string[];
  infrastructurePhases: string[];
  featured?: boolean;
};

/** Platform operations vs transformation funding — never conflate the two. */
export const COMMERCIAL_VALUE_STREAMS = {
  activationFee: {
    id: "ACTIVATION_FEE",
    label: "Activation fee (one-time)",
    mandatory: true,
    description:
      "Covers enterprise onboarding, campaign setup, brand verification, code configuration, territorial setup, and platform activation. Required before codes go live or campaigns become publicly visible.",
    note: "Paid once before campaign activation. Non-refundable."
  },
  monthlySubscription: {
    id: "MONTHLY_SUBSCRIPTION",
    label: "Monthly platform subscription (recurring)",
    mandatory: true,
    description:
      "Enterprise ESG infrastructure access — dashboards, ESG reporting, fraud monitoring, analytics, hosting, WhatsApp integrations, and operational support. Not a donation.",
    includes: [
      "Dashboard & ESG reporting access",
      "Fraud monitoring & campaign verification",
      "Analytics infrastructure & operational support",
      "Hosting, reporting systems & platform maintenance"
    ],
    minimumCommitmentMonths: 12
  },
  contributionPool: {
    id: "CONTRIBUTION_POOL",
    label: "Transformation contribution pool (optional)",
    mandatory: false,
    description:
      "Optional funding for school infrastructure — sanitation, water, electricity, digital access, fencing, and nutrition. Does not block campaign activation.",
    pitch:
      "Flexible contribution structure — monthly, quarterly, or annual — aligned to specific transformation phases."
  }
} as const;

export const COMMERCIAL_ROLLOUT_PHASES = [
  {
    phase: 1,
    title: "Phase 1 — Now",
    platformFee: "Mandatory platform access fee",
    contributionPool: "Optional impact commitment — brand controls focus and amount",
    minimumPools: null as Record<string, number> | null
  },
  {
    phase: 2,
    title: "Phase 2 — Growth",
    platformFee: "Mandatory",
    contributionPool: "Recommended transformation commitment targets introduced",
    minimumPools: { PROVINCIAL_IMPACT: 100_000, NATIONAL_TRANSFORMATION: 250_000 }
  },
  {
    phase: 3,
    title: "Phase 3 — Mature",
    platformFee: "Mandatory",
    contributionPool: "Contractual minimum impact allocations after platform trust & case studies",
    minimumPools: { PROVINCIAL_IMPACT: 100_000, NATIONAL_TRANSFORMATION: 500_000 }
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
  description: "Verified product codes can allocate micro-contributions into the transformation pool.",
  suggestedPerCodeZar: [0.1, 0.5, 1.0],
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

export type CommercialAddOnService = {
  id: string;
  service: string;
  costLabel: string;
  costMinZar: number | null;
  costMaxZar: number | null;
  isCustom: boolean;
};

/** Optional services beyond territorial impact rights packages. */
export const COMMERCIAL_ADD_ON_SERVICES: CommercialAddOnService[] = [
  {
    id: "EXTRA_PROVINCE",
    service: "Additional province activation",
    costLabel: "R50,000+",
    costMinZar: 50_000,
    costMaxZar: null,
    isCustom: false
  },
  {
    id: "EXTRA_SUBMISSION_ALLOCATION",
    service: "Additional submission allocation",
    costLabel: "Custom",
    costMinZar: null,
    costMaxZar: null,
    isCustom: true
  },
  {
    id: "AI_FRAUD_UPGRADE",
    service: "AI fraud monitoring upgrade",
    costLabel: "R25,000",
    costMinZar: 25_000,
    costMaxZar: 25_000,
    isCustom: false
  },
  {
    id: "CUSTOM_ESG_REPORT",
    service: "Custom ESG report design",
    costLabel: "R15,000",
    costMinZar: 15_000,
    costMaxZar: 15_000,
    isCustom: false
  },
  {
    id: "QR_PACKAGING",
    service: "QR code packaging integration",
    costLabel: "R20,000",
    costMinZar: 20_000,
    costMaxZar: 20_000,
    isCustom: false
  },
  {
    id: "API_INTEGRATION",
    service: "API integration support",
    costLabel: "R35,000",
    costMinZar: 35_000,
    costMaxZar: 35_000,
    isCustom: false
  },
  {
    id: "WHATSAPP_INTEGRATION",
    service: "WhatsApp verification integration",
    costLabel: "R25,000",
    costMinZar: 25_000,
    costMaxZar: 25_000,
    isCustom: false
  },
  {
    id: "RETAIL_ACTIVATION",
    service: "Retail activation support",
    costLabel: "Custom",
    costMinZar: null,
    costMaxZar: null,
    isCustom: true
  },
  {
    id: "STRATEGIC_ESG_CONSULTING",
    service: "Strategic ESG consulting",
    costLabel: "Custom",
    costMinZar: null,
    costMaxZar: null,
    isCustom: true
  },
  {
    id: "PUBLIC_MEDIA_CAMPAIGN",
    service: "Public media campaign support",
    costLabel: "Custom",
    costMinZar: null,
    costMaxZar: null,
    isCustom: true
  }
];

export type PaymentScheduleStage = {
  id: string;
  stage: string;
  percentage: number;
  description: string;
};

/** Premium market positioning — not a donation platform. */
export const PREMIUM_POSITIONING = {
  tagline: "A measurable education infrastructure and ESG intelligence platform.",
  salesPitch:
    "Brand2School gives your organisation measurable, auditable, and publicly visible education-impact infrastructure reporting.",
  notPositioning: "A donation platform.",
  avoids: ["Pay us AND fund everything", "Double cost", "Charity pressure"],
  justifies: [
    "Procurement, ESG, innovation, CSI, and sustainability budgets — not charity appeals",
    "Separate platform fee from optional transformation funding",
    "Phase sponsorship — own a category (e.g. Digital Access Phase), not random donations",
    "Participation-driven micro-contributions per verified code"
  ]
} as const;

export type ContractRequirement = {
  id: string;
  label: string;
  description: string;
};

/** Required before any package can go live — mirrors commercial activation gates. */
export const CONTRACT_PACKAGE_REQUIREMENTS: ContractRequirement[] = [
  {
    id: "AGREEMENT",
    label: "Signed participation agreement",
    description: "Brand2School Participation Agreement generated, signed, and admin-approved."
  },
  {
    id: "POPIA",
    label: "POPIA compliance acceptance",
    description: "Brand accepts POPIA-aligned data handling at application and in the participation agreement."
  },
  {
    id: "RULES",
    label: "Campaign rules approval",
    description: "Geo scope, transformation territory, and budget rules configured and approved."
  },
  {
    id: "PAYMENT",
    label: "Verified activation fee & first subscription cycle",
    description:
      "Activation fee and first monthly subscription cycle verified via EFT before public campaign visibility. Transformation pools are separate and optional."
  },
  {
    id: "CODES",
    label: "Approved code upload or generation",
    description: "Product codes registered under brand prefix and approved by admin."
  },
  {
    id: "BRAND_REVIEW",
    label: "Brand verification review",
    description: "CIPC, fraud, ESG alignment, and commercial onboarding completed by Brand2School."
  }
];

/** Billing workflow — activation fee plus first subscription cycle before launch. */
export const RECOMMENDED_PAYMENT_SCHEDULE: PaymentScheduleStage[] = [
  {
    id: "ACTIVATION_FEE",
    stage: "Activation fee",
    percentage: 100,
    description:
      "One-time EFT before campaign activation — covers onboarding, verification, code setup, and territorial configuration."
  },
  {
    id: "FIRST_SUBSCRIPTION",
    stage: "First subscription cycle",
    percentage: 100,
    description:
      "First monthly (or quarterly/annual) enterprise ESG infrastructure subscription — due with activation before public launch."
  },
  {
    id: "RECURRING",
    stage: "Ongoing subscription",
    percentage: 100,
    description:
      "Recurring monthly billing for platform operations. Suspended subscriptions pause campaign participation; data is retained."
  }
];

export const BILLING_WORKFLOW_STEPS = [
  "Brand registration — enterprise application submitted",
  "Registration & participation guide email sent",
  "Verification & commercial review by admin",
  "Participation agreement signed",
  "Activation invoice — activation fee + first subscription cycle",
  "Campaign configuration — territories, codes, dashboards",
  "Campaign activation — publicly active"
] as const;

export function formatActivationFee(pkg: TerritorialPackage): string {
  if (pkg.activationFeeZar <= 0) return "Custom enterprise agreement";
  return formatZar(pkg.activationFeeZar);
}

export function formatMonthlySubscriptionRange(pkg: TerritorialPackage): string {
  if (pkg.monthlySubscriptionMaxZar == null) {
    return `${formatZar(pkg.monthlySubscriptionMinZar)}+/month`;
  }
  if (pkg.monthlySubscriptionMinZar === pkg.monthlySubscriptionMaxZar) {
    return `${formatZar(pkg.monthlySubscriptionMinZar)}/month`;
  }
  return `${formatZar(pkg.monthlySubscriptionMinZar)} – ${formatZar(pkg.monthlySubscriptionMaxZar)}/month`;
}

export function serializeCommercialCatalog() {
  return {
    valueStreams: COMMERCIAL_VALUE_STREAMS,
    rolloutPhases: COMMERCIAL_ROLLOUT_PHASES,
    ecosystem: serializeTransformationLicenseModel(),
    industryPhaseAlignment: [...INDUSTRY_PHASE_ALIGNMENT],
    codeContribution: CODE_CONTRIBUTION_MODEL,
    billingWorkflow: [...BILLING_WORKFLOW_STEPS],
    packages: TERRITORIAL_PACKAGES.map((p) => ({
      id: p.id,
      name: p.name,
      partnerTitle: p.partnerTitle,
      idealFor: p.idealFor,
      coverage: p.coverage,
      activationFeeZar: p.activationFeeZar,
      activationFeeLabel: formatActivationFee(p),
      monthlySubscriptionMinZar: p.monthlySubscriptionMinZar,
      monthlySubscriptionMaxZar: p.monthlySubscriptionMaxZar,
      monthlySubscriptionRange: formatMonthlySubscriptionRange(p),
      platformAccessFeeMinZar: p.activationFeeZar,
      platformAccessFeeMaxZar: p.monthlySubscriptionMaxZar,
      platformAccessFeeRange: `${formatActivationFee(p)} activation + ${formatMonthlySubscriptionRange(p)}`,
      priceMinZar: p.activationFeeZar,
      priceMaxZar: p.monthlySubscriptionMaxZar,
      priceRange: `${formatActivationFee(p)} + ${formatMonthlySubscriptionRange(p)}`,
      recommendedContributionPoolZar: p.recommendedContributionPoolZar,
      recommendedContributionPoolLabel:
        p.recommendedContributionPoolZar != null
          ? `From ${formatZar(p.recommendedContributionPoolZar)} (optional)`
          : "Custom (optional)",
      contributionPoolMandatory: false,
      subscriptionPlan: p.subscriptionPlan,
      scopeType: p.scopeType,
      participation: p.participation,
      focus: p.focus,
      includes: p.includes,
      infrastructurePhases: p.infrastructurePhases,
      featured: p.featured ?? false
    })),
    infrastructurePhases: [...INFRASTRUCTURE_PHASE_TRACK],
    phaseSponsorshipAddons: [...PHASE_SPONSORSHIP_ADDONS],
    addOnServices: COMMERCIAL_ADD_ON_SERVICES,
    paymentSchedule: RECOMMENDED_PAYMENT_SCHEDULE,
    contractRequirements: CONTRACT_PACKAGE_REQUIREMENTS,
    positioning: PREMIUM_POSITIONING
  };
}

export const TERRITORIAL_PACKAGES: TerritorialPackage[] = [
  {
    id: "SCHOOL_TRANSFORMATION",
    name: "School Package",
    partnerTitle: "Official School Transformation Partner",
    idealFor: "Local businesses, SMEs, and community partners",
    coverage: "One selected school — transformation territory",
    activationFeeZar: 10_000,
    monthlySubscriptionMinZar: 3_000,
    monthlySubscriptionMaxZar: 8_000,
    priceMinZar: 10_000,
    priceMaxZar: 8_000,
    recommendedContributionPoolZar: 50_000,
    scopeType: "SCHOOL_CLUSTER",
    subscriptionPlan: "SCHOOL",
    participation: "Unlimited verified participation for that school",
    focus: "Optional phase sponsorship — water, digital, nutrition, or power — aligned to your industry",
    infrastructurePhases: [...INFRASTRUCTURE_PHASE_TRACK],
    includes: [
      "Activation: onboarding, verification, code setup & territorial configuration",
      "Monthly ESG infrastructure: dashboards, reporting & fraud monitoring for one school",
      "Campaign administration & public partner profile",
      "Optional transformation pool from R50,000 — does not block activation"
    ]
  },
  {
    id: "DISTRICT_TRANSFORMATION",
    name: "District Package",
    partnerTitle: "Official District Transformation Partner",
    idealFor: "Regional retailers, franchise groups, district-focused campaigns",
    coverage: "All schools within one district / municipality",
    activationFeeZar: 25_000,
    monthlySubscriptionMinZar: 10_000,
    monthlySubscriptionMaxZar: 25_000,
    priceMinZar: 25_000,
    priceMaxZar: 25_000,
    recommendedContributionPoolZar: 500_000,
    scopeType: "DISTRICT",
    subscriptionPlan: "DISTRICT",
    participation: "Unlimited submissions across district schools",
    focus: "District territory + optional phase ownership (e.g. District Water Phase)",
    infrastructurePhases: [...INFRASTRUCTURE_PHASE_TRACK],
    includes: [
      "Activation: district campaign setup, codes & territorial configuration",
      "Monthly ESG infrastructure: district ops, fraud controls & analytics",
      "Multi-school intelligence & monthly ESG reports",
      "Optional transformation pool from R500,000 — not required at launch"
    ]
  },
  {
    id: "PROVINCIAL_IMPACT",
    name: "Provincial Package",
    partnerTitle: "Official Education Transformation Partner (Province)",
    idealFor: "Telecoms, banks, FMCG brands, major retailers",
    coverage: "All districts and schools within one province",
    activationFeeZar: 75_000,
    monthlySubscriptionMinZar: 35_000,
    monthlySubscriptionMaxZar: 80_000,
    priceMinZar: 75_000,
    priceMaxZar: 80_000,
    recommendedContributionPoolZar: 500_000,
    scopeType: "PROVINCIAL",
    subscriptionPlan: "PROVINCIAL",
    participation: "Unlimited verified submissions province-wide",
    focus: "Province-scale ESG intelligence — school location determines eligibility",
    infrastructurePhases: [...INFRASTRUCTURE_PHASE_TRACK],
    featured: true,
    includes: [
      "Activation: provincial territory, executive onboarding & verification stack",
      "Monthly ESG infrastructure: provincial dashboards, heatmaps & account management",
      "Phase sponsorship category ownership (digital, water, nutrition, etc.)",
      "Optional transformation pool from R500,000 — brand-controlled phases & schools"
    ]
  },
  {
    id: "NATIONAL_TRANSFORMATION",
    name: "National Package",
    partnerTitle: "Official National Education Transformation Partner",
    idealFor: "Enterprise retailers, beverage companies, national brands",
    coverage: "All provinces, districts, and schools nationally",
    activationFeeZar: 250_000,
    monthlySubscriptionMinZar: 100_000,
    monthlySubscriptionMaxZar: null,
    priceMinZar: 250_000,
    priceMaxZar: null,
    recommendedContributionPoolZar: 2_000_000,
    scopeType: "NATIONAL",
    subscriptionPlan: "NATIONAL",
    participation: "Unlimited national submissions — products may move nationally; schools determine eligibility",
    focus: "National ESG intelligence & category ownership at scale",
    infrastructurePhases: [...INFRASTRUCTURE_PHASE_TRACK],
    includes: [
      "Activation: national enterprise onboarding & territorial configuration",
      "Monthly ESG infrastructure: enterprise analytics, API & boardroom reporting",
      "National rankings & participation-driven code micro-contributions",
      "Optional transformation pool from R2,000,000+"
    ]
  },
  {
    id: "GOVERNMENT_INSTITUTIONAL",
    name: "Government & Institutional Partnership",
    partnerTitle: "Public-Private Transformation Partner",
    idealFor: "Government departments, NGOs, development agencies, institutions",
    coverage: "Custom geographic and infrastructure targeting",
    activationFeeZar: 0,
    monthlySubscriptionMinZar: 0,
    monthlySubscriptionMaxZar: null,
    priceMinZar: 0,
    priceMaxZar: null,
    recommendedContributionPoolZar: null,
    scopeType: "NATIONAL",
    subscriptionPlan: "NATIONAL",
    participation: "Custom participation framework",
    focus: "Multi-year programmes, provincial coordination, compliance & national reporting",
    infrastructurePhases: [...INFRASTRUCTURE_PHASE_TRACK],
    includes: [
      "Custom platform & reporting frameworks",
      "Provincial coordination & compliance intelligence",
      "Transformation funding structured per PPP or grant — separate from platform fees"
    ]
  }
];

export function packageById(id: TerritorialPackageId): TerritorialPackage | undefined {
  return TERRITORIAL_PACKAGES.find((p) => p.id === id);
}

export function packageByScopeType(scopeType: CampaignScopeType): TerritorialPackage {
  return (
    TERRITORIAL_PACKAGES.find((p) => p.scopeType === scopeType && p.id !== "GOVERNMENT_INSTITUTIONAL") ??
    TERRITORIAL_PACKAGES.find((p) => p.id === "NATIONAL_TRANSFORMATION")!
  );
}

export function formatPriceRange(pkg: TerritorialPackage): string {
  return `${formatActivationFee(pkg)} + ${formatMonthlySubscriptionRange(pkg)}`;
}

export function subscriptionPlanForScope(scopeType: CampaignScopeType): BrandSubscriptionPlan {
  return packageByScopeType(scopeType).subscriptionPlan;
}

/** Default one-time activation fee for invoicing. */
export function defaultActivationFeeZar(scopeType: CampaignScopeType): number {
  const pkg = packageByScopeType(scopeType);
  return pkg.activationFeeZar > 0 ? pkg.activationFeeZar : 0;
}

/** Default monthly subscription range for a territory package. */
export function defaultMonthlySubscriptionZar(scopeType: CampaignScopeType): {
  min: number;
  max: number | null;
} {
  const pkg = packageByScopeType(scopeType);
  return { min: pkg.monthlySubscriptionMinZar, max: pkg.monthlySubscriptionMaxZar };
}

/** @deprecated Use defaultActivationFeeZar */
export function defaultPlatformAccessFeeZar(scopeType: CampaignScopeType): number {
  return defaultActivationFeeZar(scopeType);
}

/** @deprecated Use defaultActivationFeeZar */
export function defaultTerritorialRightsFeeZar(scopeType: CampaignScopeType): number {
  return defaultActivationFeeZar(scopeType);
}

export function territorialRightsLabel(scopeType: CampaignScopeType): string {
  return packageByScopeType(scopeType).partnerTitle;
}

export function scopeTypeLabel(scopeType: CampaignScopeType): string {
  return packageByScopeType(scopeType).name.replace(" Package", "");
}
