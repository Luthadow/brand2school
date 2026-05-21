import { parseParticipationCode, parseStructuredCode } from "../../lib/codeIdentity.js";

/** Returns true when code value belongs to the brand prefix (structured or PREFIX-token legacy). */
export function codeBelongsToBrandPrefix(codeValue: string, brandPrefix: string): boolean {
  const prefix = brandPrefix.trim().toUpperCase();
  const normalized = codeValue.trim().toUpperCase();
  if (!prefix || !normalized) return false;

  const parsed = parseParticipationCode(normalized);
  if (parsed?.format === "structured") {
    return parsed.parts.brandPrefix === prefix;
  }

  if (normalized.startsWith(`${prefix}-`)) return true;
  if (normalized === prefix) return false;

  return false;
}

export function filterCodesForBrand(
  codes: string[],
  brandPrefix: string
): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const code of codes) {
    if (codeBelongsToBrandPrefix(code, brandPrefix)) valid.push(code);
    else invalid.push(code);
  }
  return { valid, invalid };
}
