import type { CampaignScopeType } from "../../generated/prisma/index.js";
import { defaultActivationFeeZar, formatZar } from "./territorialPackages.js";

export { formatZar };

/** One-time activation fee before campaign activation (SETUP_FEE invoices). */
export function setupFeeZarForScope(scopeType: CampaignScopeType): number {
  return defaultActivationFeeZar(scopeType);
}
