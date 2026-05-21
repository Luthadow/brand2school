import crypto from "node:crypto";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Alphanumeric segments: BRAND-CAMPAIGN-BATCH-TOKEN-CHECK */
const STRUCTURED_CODE =
  /^([A-Z0-9]{2,8})-([A-Z0-9]{2,6})-([A-Z0-9]{1,4})-([A-Z0-9]{4,10})-([A-Z0-9]{2})$/;

export type StructuredCodeParts = {
  brandPrefix: string;
  campaignCode: string;
  batchCode: string;
  token: string;
  checksum: string;
  fullValue: string;
};

export type ParsedParticipationCode =
  | { format: "structured"; parts: StructuredCodeParts }
  | { format: "legacy"; value: string };

export function generateSecureToken(length = 6): string {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join("");
}

/** Checksum derived from identity payload — tamper-evident, not prefix-only trust. */
export function computeCodeChecksum(
  brandPrefix: string,
  campaignCode: string,
  batchCode: string,
  token: string
): string {
  const payload = `${brandPrefix}|${campaignCode}|${batchCode}|${token}`;
  const digest = crypto.createHash("sha256").update(payload).digest("hex").toUpperCase();
  return digest.slice(0, 2);
}

export function formatStructuredCode(
  brandPrefix: string,
  campaignCode: string,
  batchCode: string,
  token: string
): string {
  const brand = brandPrefix.toUpperCase();
  const campaign = campaignCode.toUpperCase();
  const batch = batchCode.toUpperCase();
  const secureToken = token.toUpperCase();
  const checksum = computeCodeChecksum(brand, campaign, batch, secureToken);
  return `${brand}-${campaign}-${batch}-${secureToken}-${checksum}`;
}

export function parseStructuredCode(raw: string): StructuredCodeParts | null {
  const normalized = raw.trim().toUpperCase();
  const match = STRUCTURED_CODE.exec(normalized);
  if (!match) return null;

  return {
    brandPrefix: match[1],
    campaignCode: match[2],
    batchCode: match[3],
    token: match[4],
    checksum: match[5],
    fullValue: normalized
  };
}

export function parseParticipationCode(raw: string): ParsedParticipationCode | null {
  const normalized = raw.trim().toUpperCase();
  if (!normalized) return null;

  const structured = parseStructuredCode(normalized);
  if (structured) return { format: "structured", parts: structured };

  if (/^[A-Z0-9]{4,24}$/.test(normalized)) {
    return { format: "legacy", value: normalized };
  }

  return null;
}

export function verifyStructuredChecksum(parts: StructuredCodeParts): boolean {
  const expected = computeCodeChecksum(parts.brandPrefix, parts.campaignCode, parts.batchCode, parts.token);
  return expected === parts.checksum.toUpperCase();
}

export function deriveBrandPrefix(name: string, existing?: Set<string>): string {
  const words = name.replace(/[^a-zA-Z\s]/g, " ").trim().split(/\s+/).filter(Boolean);
  let candidate = "";
  if (words.length >= 2) {
    candidate = (words[0].slice(0, 2) + words[1].slice(0, 2)).toUpperCase();
  } else if (words.length === 1) {
    candidate = words[0].replace(/[^A-Z]/gi, "").toUpperCase().slice(0, 4);
  }
  candidate = (candidate || "BRND").slice(0, 8).padEnd(2, "X");

  if (!existing?.has(candidate)) return candidate;
  for (let i = 2; i <= 99; i += 1) {
    const alt = `${candidate.slice(0, 6)}${i}`.slice(0, 8);
    if (!existing.has(alt)) return alt;
  }
  return `${candidate.slice(0, 4)}${generateSecureToken(2)}`;
}

export function deriveCampaignCode(slug: string, name?: string): string {
  const fromSlug = slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.slice(0, 1))
    .join("")
    .toUpperCase();
  if (fromSlug.length >= 2) return fromSlug.slice(0, 6);

  const fromName = (name ?? slug).replace(/[^a-zA-Z]/g, "").toUpperCase();
  return (fromName.slice(0, 3) || "CMP").padEnd(3, "X");
}

export function deriveBatchCode(sequence = 1, year = new Date().getFullYear()): string {
  const yy = String(year).slice(-2);
  if (sequence <= 1) return yy;
  return `${yy}${String(sequence).padStart(2, "0")}`.slice(0, 4);
}

export function isInvalidCodePattern(code: string): boolean {
  const parsed = parseParticipationCode(code);
  if (!parsed) return true;

  if (parsed.format === "structured") {
    const { brandPrefix, token } = parsed.parts;
    if (/^(TEST|FAKE|DEMO|AAAA|BBBB)$/.test(brandPrefix)) return true;
    if (/^(.)\1{5,}$/.test(token)) return true;
    return false;
  }

  const normalized = parsed.value;
  if (/^(TEST|FAKE|DEMO|AAAA|BBBB|CCCC|DDDD|EEEE|FFFF)/.test(normalized)) return true;
  if (/^(.)\1{5,}$/.test(normalized)) return true;
  if (/^\d{6,}$/.test(normalized)) return true;
  return false;
}

/** @deprecated use computeCodeChecksum for structured codes */
export function computeChecksum(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 4).toUpperCase();
}

export function verifyStoredChecksum(value: string, checksum: string | null | undefined): boolean {
  if (!checksum) return true;

  const structured = parseStructuredCode(value);
  if (structured) {
    return verifyStructuredChecksum(structured) && structured.checksum === checksum.toUpperCase();
  }

  return computeChecksum(value) === checksum.toUpperCase();
}

/** @deprecated legacy batch format */
export function campaignCodePrefix(slug: string): string {
  return deriveCampaignCode(slug);
}

/** @deprecated legacy batch format */
export function regionCode(district: string): string {
  const clean = district.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return (clean.slice(0, 3) || "ZAF").padEnd(3, "X");
}

/** @deprecated legacy batch format */
export function formatParticipationCode(
  campaignPrefix: string,
  region: string,
  year: number,
  token: string
): string {
  return `${campaignPrefix}-${region}-${year}-${token}`;
}

/** @deprecated */
export function buildParticipationCode(
  campaignSlug: string,
  district: string,
  year = new Date().getFullYear()
): { value: string; token: string; checksum: string } {
  const token = generateSecureToken(7);
  const value = formatParticipationCode(campaignCodePrefix(campaignSlug), regionCode(district), year, token);
  return { value, token, checksum: computeChecksum(value) };
}
