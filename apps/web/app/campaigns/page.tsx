import { CampaignShowcaseCard } from "../../components/partners/CampaignShowcaseCard";
import { fetchPublicCampaigns } from "../../lib/platformPublic";

export default async function CampaignsDirectoryPage(): Promise<JSX.Element> {
  const campaigns = await fetchPublicCampaigns();

  return (
    <div className="lp pp-page">
      <section className="lp-section lp-section-light">
        <div className="lp-container">
          <p className="ds-eyebrow">Active missions</p>
          <h1 className="ds-section-title ds-section-title--left">Campaign showcase</h1>
          <p className="lp-problem-text">Live and recent campaigns from verified ACTIVE brand partners.</p>
          {campaigns.length === 0 ? (
            <p className="lp-live-empty" style={{ marginTop: "2rem" }}>
              Campaigns will appear as brand partners launch verified missions.
            </p>
          ) : (
            <div className="lp-campaign-grid" style={{ marginTop: "2rem" }}>
              {campaigns.map((c) => (
                <CampaignShowcaseCard key={c.slug} campaign={c} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
