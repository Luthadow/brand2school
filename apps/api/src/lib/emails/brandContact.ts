export type BrandContactPerson = {
  name?: string;
  email?: string;
};

export type BrandContactSource = {
  name: string;
  primaryContactEmail?: string | null;
  contactPersons?: unknown;
};

function parseContactPersons(raw: unknown): BrandContactPerson[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is BrandContactPerson => typeof p === "object" && p !== null);
}

/** Primary enterprise contact for lifecycle mail (registration guide, invoices, agreements). */
export function resolveBrandContact(brand: BrandContactSource): { email: string; name: string } | null {
  const email = brand.primaryContactEmail?.trim() || parseContactPersons(brand.contactPersons)[0]?.email?.trim();
  if (!email) return null;
  const person = parseContactPersons(brand.contactPersons).find((p) => p.email?.trim() === email);
  const name = person?.name?.trim() || brand.name;
  return { email, name };
}
