"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { brandCsrfHeaders } from "../../lib/brandClientFetch";
import { CONTRIBUTION_PER_CODE_OPTIONS_ZAR } from "../../lib/campaignBuilder";
import type { PortalCampaign } from "../../lib/brandPortal";

export function CampaignContributionPicker({
  campaign,
  onSaved
}: {
  campaign: PortalCampaign;
  onSaved?: () => void;
}): JSX.Element {
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function save(): Promise<void> {
    if (selected == null) {
      setError("Select R2, R5, or R10.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/setup`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...brandCsrfHeaders() },
        body: JSON.stringify({ contributionPerCodeZar: selected })
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? "Could not save contribution.");
        return;
      }
      setDone(true);
      onSaved?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bp-code-setup-card bp-code-setup-card--recommended">
      <p className="bp-code-setup-badge">Required before go-live</p>
      <h3>Contribution per verified code</h3>
      <p>
        Choose how much <strong>{campaign.name}</strong> contributes for every verified campaign code. This locks
        after activation.
      </p>
      <div className="bp-contrib-options">
        {CONTRIBUTION_PER_CODE_OPTIONS_ZAR.map((amount) => (
          <button
            key={amount}
            type="button"
            className={
              selected === amount ? "bp-contrib-option bp-contrib-option--active" : "bp-contrib-option"
            }
            onClick={() => setSelected(amount)}
            disabled={busy || done}
          >
            R{amount.toFixed(2)}
          </button>
        ))}
      </div>
      {selected != null ? (
        <p className="bp-muted">
          At {campaign.targetSubmissions.toLocaleString("en-ZA")} verified codes →{" "}
          <strong>
            R{(campaign.targetSubmissions * selected).toLocaleString("en-ZA")} School Support Generated
          </strong>{" "}
          (target).
        </p>
      ) : null}
      <button
        type="button"
        className="bp-inv-btn bp-inv-btn--primary"
        onClick={() => void save()}
        disabled={busy || done || selected == null}
      >
        {busy ? <Loader2 size={16} className="ba-spin" /> : null}
        {done ? "Saved — campaign can go live" : "Confirm contribution"}
      </button>
      {error ? <p className="bp-inv-alert">{error}</p> : null}
    </div>
  );
}
