import { resolveBrandContact, type BrandContactSource } from "../../lib/emails/brandContact.js";

/** Fire-and-forget brand lifecycle mail; never fails the admin/API request. */
export async function trySendBrandLifecycleEmail(
  brand: BrandContactSource,
  send: (contact: { email: string; name: string }) => Promise<unknown>
): Promise<void> {
  const contact = resolveBrandContact(brand);
  if (!contact) return;
  try {
    await send(contact);
  } catch (err) {
    console.error("[mail] brand lifecycle email failed:", err);
  }
}
