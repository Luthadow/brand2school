/** Public contact inboxes — keep in sync with apps/web/lib/contact.ts */

export const CONTACT = {
  general: "info@brand2school.co.za",
  schools: "schools@brand2school.co.za",
  brands: "brands@brand2school.co.za",
  support: "support@brand2school.co.za",
  /** Primary line — voice calls and WhatsApp (same number). */
  phone: "068 796 7963",
  phoneTel: "+27687967963",
  /** @deprecated Use phone / phoneTel */
  whatsapp: "068 796 7963",
  /** E.164 without + — for wa.me links */
  whatsappTel: "27687967963"
} as const;

export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${CONTACT.whatsappTel}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function telUrl(): string {
  return `tel:${CONTACT.phoneTel}`;
}

export const PUBLIC_CONTACT_LIST = [
  { label: "General enquiries", email: CONTACT.general },
  { label: "School onboarding", email: CONTACT.schools },
  { label: "Brand partnerships", email: CONTACT.brands },
  { label: "Technical support", email: CONTACT.support }
] as const;

export const PUBLIC_PHONE = {
  label: "Phone & WhatsApp",
  display: CONTACT.phone,
  telHref: telUrl(),
  whatsappHref: whatsappUrl()
} as const;

/** Human-managed internal mailboxes — do not use for SMTP */
export const INTERNAL_CONTACT = {
  admin: "admin@brand2school.co.za",
  superadmin: "superadmin@brand2school.co.za"
} as const;

/** System sender — must match MAIL_FROM and SMTP_USER in production */
export const SYSTEM_MAIL = {
  noreply: "noreply@brand2school.co.za"
} as const;
