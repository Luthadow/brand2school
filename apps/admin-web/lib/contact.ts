/** Contact inboxes — keep in sync with apps/api/src/lib/contacts.ts */

export const CONTACT = {
  general: "info@brand2school.co.za",
  schools: "schools@brand2school.co.za",
  brands: "brands@brand2school.co.za",
  support: "support@brand2school.co.za",
  phone: "068 796 7963",
  phoneTel: "+27687967963",
  whatsapp: "068 796 7963",
  whatsappTel: "27687967963"
} as const;

export const INTERNAL_CONTACT = {
  admin: "admin@brand2school.co.za",
  superadmin: "superadmin@brand2school.co.za"
} as const;

export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${CONTACT.whatsappTel}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function telUrl(): string {
  return `tel:${CONTACT.phoneTel}`;
}

export function mailto(email: string, subject?: string): string {
  if (!subject) return `mailto:${email}`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
