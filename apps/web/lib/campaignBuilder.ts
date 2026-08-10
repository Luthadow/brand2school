export type CampaignScopeType = "NATIONAL" | "PROVINCIAL";

export type CampaignProductDraft = {
  name: string;
  sku: string;
};

export type CampaignBuilderDraft = {
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  category: string;
  infrastructureGoal: string;
  targetSubmissions: number;
  contributionPerCodeZar: number;
  contributionPoolZar: string;
  scopeType: CampaignScopeType;
  allowedProvinces: string[];
  budgetAllocatedZar: string;
  pauseOnBudgetExhausted: boolean;
  products: CampaignProductDraft[];
};

export type ProvinceOption = { code: string; name: string };

export type ActivationGate = {
  canActivate: boolean;
  blockers: string[];
  checklist: {
    brandOnboarding: boolean;
    agreementSigned: boolean;
    activationFeeVerified: boolean;
    subscriptionActive: boolean;
    setupPaymentVerified: boolean;
    codesApproved: boolean;
    rulesConfigured: boolean;
    launchApproved: boolean;
  };
};

export const WIZARD_STEPS = [
  { key: "basics", label: "Campaign basics" },
  { key: "impact", label: "Impact & goals" },
  { key: "products", label: "Products" },
  { key: "territory", label: "Territory" },
  { key: "review", label: "Review" }
] as const;

export type WizardStepKey = (typeof WIZARD_STEPS)[number]["key"];

function padDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function defaultCampaignDraft(): CampaignBuilderDraft {
  const startsAt = new Date();
  const endsAt = new Date(startsAt);
  endsAt.setMonth(endsAt.getMonth() + 12);

  return {
    name: "",
    description: "",
    startsAt: padDate(startsAt),
    endsAt: padDate(endsAt),
    category: "Libraries",
    infrastructureGoal: "",
    targetSubmissions: 1_000,
    contributionPerCodeZar: 5,
    contributionPoolZar: "",
    scopeType: "NATIONAL",
    allowedProvinces: [],
    budgetAllocatedZar: "",
    pauseOnBudgetExhausted: true,
    products: [{ name: "", sku: "" }]
  };
}

export function slugPreviewFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export const CONTRIBUTION_PER_CODE_OPTIONS_ZAR = [2, 5, 10] as const;

export function buildCreateCampaignPayload(
  draft: CampaignBuilderDraft,
  brandId: string
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    brandId,
    name: draft.name.trim(),
    startsAt: new Date(draft.startsAt).toISOString(),
    endsAt: new Date(draft.endsAt).toISOString(),
    scopeType: draft.scopeType,
    category: draft.category,
    infrastructureGoal: draft.infrastructureGoal.trim() || draft.category,
    targetSubmissions: draft.targetSubmissions,
    contributionPerCodeZar: draft.contributionPerCodeZar,
    pauseOnBudgetExhausted: draft.pauseOnBudgetExhausted,
    description: draft.description.trim() || undefined
  };

  if (draft.scopeType === "PROVINCIAL") {
    payload.allowedProvinces = draft.allowedProvinces;
  }

  const pool = Number(draft.contributionPoolZar);
  if (draft.contributionPoolZar.trim() && Number.isFinite(pool) && pool >= 0) {
    payload.contributionPoolZar = pool;
  }

  const budget = Number(draft.budgetAllocatedZar);
  if (draft.budgetAllocatedZar.trim() && Number.isFinite(budget) && budget >= 0) {
    payload.budgetAllocatedZar = budget;
  }

  return payload;
}

export const ACTIVATION_CHECKLIST_LABELS: Record<keyof ActivationGate["checklist"], string> = {
  brandOnboarding: "Brand onboarding complete",
  agreementSigned: "Participation agreement signed",
  activationFeeVerified: "Activation fee verified",
  subscriptionActive: "Subscription active",
  setupPaymentVerified: "Campaign setup fee verified",
  codesApproved: "Product codes uploaded & approved",
  rulesConfigured: "Campaign rules configured",
  launchApproved: "Launch approved"
};
