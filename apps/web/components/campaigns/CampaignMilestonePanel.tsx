import { formatCount } from "../../lib/formatCount";
import type { PublicCampaignDetail } from "../../lib/platformPublic";

function formatZar(value: string | number): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return `R${value}`;
  return `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function CampaignMilestonePanel({
  campaign
}: {
  campaign: PublicCampaignDetail;
}): JSX.Element {
  const generated = campaign.schoolSupportGeneratedZar ?? campaign.fundingRaisedZar;
  const perCode = campaign.contributionPerCodeZar;
  const milestones = campaign.milestones ?? [];
  const progress = Math.min(100, campaign.percentToTarget);

  return (
    <section className="cm-milestone" aria-label="Campaign milestone">
      <p className="cm-milestone-eyebrow">Campaign milestone</p>
      <div className="cm-milestone-hero">
        <div>
          <strong>{formatCount(campaign.validSubmissions)}</strong>
          <span>Verified contributions</span>
        </div>
        <div>
          <strong>{formatZar(generated)}</strong>
          <span>{campaign.terminology?.generatedLabel ?? "School Support Generated"}</span>
        </div>
        <div>
          <strong>{progress}%</strong>
          <span>Campaign progress</span>
        </div>
      </div>

      <p className="cm-milestone-note">
        Every verified code contributes <strong>{formatZar(perCode)}</strong> toward this campaign.
      </p>

      <div className="cm-milestone-track" aria-hidden="true">
        <div className="cm-milestone-track-fill" style={{ width: `${progress}%` }} />
        <div
          className="cm-milestone-track-marker"
          style={{ left: `calc(${progress}% - 6px)` }}
          title={`${formatCount(campaign.validSubmissions)} verified`}
        />
      </div>
      <div className="cm-milestone-scale">
        <span>0</span>
        {milestones.map((m) => (
          <span key={m.verifiedCodes} className={m.reached ? "cm-milestone-scale--reached" : undefined}>
            {formatCount(m.verifiedCodes)}
          </span>
        ))}
      </div>

      {milestones.length > 0 ? (
        <ul className="cm-milestone-list">
          {milestones.map((m) => (
            <li key={m.verifiedCodes} className={m.reached ? "cm-milestone-list--reached" : undefined}>
              <span>
                {m.reached ? "✓" : "○"} {formatCount(m.verifiedCodes)} codes · {formatZar(m.generatedZar)}
              </span>
              <em>{m.label}</em>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="cm-milestone-meta">
        Target: {formatCount(campaign.targetSubmissions)} verified codes
        {campaign.remainingToTarget != null
          ? ` · ${formatCount(campaign.remainingToTarget)} remaining`
          : ""}
        {campaign.submittedCount != null
          ? ` · ${formatCount(campaign.submittedCount)} submitted / ${formatCount(campaign.validSubmissions)} verified`
          : ""}
      </p>
      {campaign.terminology?.note ? <p className="cm-milestone-legal">{campaign.terminology.note}</p> : null}
    </section>
  );
}
