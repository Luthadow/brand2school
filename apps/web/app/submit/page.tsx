import type { Metadata } from "next";
import Link from "next/link";
import { ParticipationSubmitForm } from "../../components/participation/ParticipationSubmitForm";
import { fetchPublicCampaigns } from "../../lib/platformPublic";

export const metadata: Metadata = {
  title: "Submit a Code — Brand2School",
  description:
    "Verify your brand product code online — no WhatsApp required. Credit your school toward infrastructure campaigns."
};

export default async function SubmitCodePage({
  searchParams
}: {
  searchParams?: { campaign?: string };
}): Promise<JSX.Element> {
  const campaigns = await fetchPublicCampaigns();
  const options = campaigns
    .filter((c) => c.isActive)
    .map((c) => ({ slug: c.slug, name: c.name, brandName: c.brandName }));
  const defaultCampaignSlug = searchParams?.campaign?.trim().toLowerCase() ?? "";

  return (
    <div className="lp">
      <section className="lp-section lp-section-light">
        <div className="lp-container" style={{ maxWidth: "42rem" }}>
          <p className="ds-eyebrow">Community participation</p>
          <h1 className="ds-section-title ds-section-title--left">Submit your product code</h1>
          <p className="lp-problem-text">
            Bought a participating product? Select your school and campaign, enter the code from the pack — on this
            website or via WhatsApp. No learner accounts. No child data.
          </p>
          <ParticipationSubmitForm campaigns={options} defaultCampaignSlug={defaultCampaignSlug} />
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
