import type { Metadata } from "next";
import Link from "next/link";
import { ParticipationSubmitForm } from "../../components/participation/ParticipationSubmitForm";
import { PublicLookupSearch } from "../../components/lookup/PublicLookupSearch";

export const metadata: Metadata = {
  title: "Submit a Code — Brand2School",
  description:
    "Verify your brand product code online — no WhatsApp required. Credit your school toward infrastructure campaigns."
};

export default async function SubmitCodePage({
  searchParams
}: {
  searchParams?: { campaign?: string; brand?: string };
}): Promise<JSX.Element> {
  const defaultCampaignSlug = searchParams?.campaign?.trim().toLowerCase() ?? "";
  const defaultBrandSlug = searchParams?.brand?.trim().toLowerCase() ?? "";

  return (
    <div className="lp">
      <section className="lp-section lp-section-light">
        <div className="lp-container" style={{ maxWidth: "42rem" }}>
          <p className="ds-eyebrow">Community participation</p>
          <h1 className="ds-section-title ds-section-title--left">Submit your product code</h1>
          <p className="lp-problem-text">
            Bought a participating product? Select your school and brand from the list, enter the code from the pack —
            on this website or via WhatsApp. No learner accounts. No child data.
          </p>
          <div style={{ marginBottom: "1.75rem" }}>
            <p className="ds-eyebrow" style={{ marginBottom: "0.35rem" }}>
              Quick lookup
            </p>
            <p style={{ fontSize: "0.92rem", color: "var(--text-muted)", marginBottom: "0.65rem" }}>
              Check if your school is already registered before you submit a code.
            </p>
            <PublicLookupSearch compact defaultType="school" />
          </div>
          <ParticipationSubmitForm
            defaultCampaignSlug={defaultCampaignSlug}
            defaultBrandSlug={defaultBrandSlug}
          />
          <p style={{ marginTop: "2rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Codes are single-use and verified against the brand campaign database.{" "}
            <Link href="/trust">How we verify participation</Link> ·{" "}
            <Link href="/campaigns">Browse campaigns</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
