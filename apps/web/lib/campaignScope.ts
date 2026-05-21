export type CampaignScopeInput = {
  scopeType?: string;
  scopeLabel?: string;
  scopeBadge?: string;
  eligibleProvinces?: string[];
};

export function formatScopeBadge(input: CampaignScopeInput): string | null {
  if (input.scopeBadge) return input.scopeBadge;
  const scopeType = input.scopeType ?? "NATIONAL";
  const scopeLabel = input.scopeLabel ?? "";

  if (scopeType === "NATIONAL") return null;
  if (scopeType === "PROVINCIAL") {
    const first = scopeLabel.split(",")[0]?.trim();
    return first ? `${first} only` : "Provincial";
  }
  if (scopeType === "DISTRICT") return "District package";
  if (scopeType === "SCHOOL_CLUSTER") return "Selected schools";
  return scopeLabel || null;
}

export function scopeBadgeVariant(scopeType?: string): "national" | "provincial" | "district" | "cluster" {
  switch (scopeType) {
    case "PROVINCIAL":
      return "provincial";
    case "DISTRICT":
      return "district";
    case "SCHOOL_CLUSTER":
      return "cluster";
    default:
      return "national";
  }
}
