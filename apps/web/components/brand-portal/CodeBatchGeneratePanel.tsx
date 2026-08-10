"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { brandCsrfHeaders } from "../../lib/brandClientFetch";

type CampaignOption = { id: string; name: string };

type GenerateResult = {
  generatedCount?: number;
  batchCount?: number;
  packSize?: number;
  message?: string;
};

export function CodeBatchGeneratePanel({
  campaigns,
  defaultCampaignId,
  onGenerated
}: {
  campaigns: CampaignOption[];
  defaultCampaignId?: string | null;
  onGenerated?: () => void;
}): JSX.Element {
  const [campaignId, setCampaignId] = useState(defaultCampaignId ?? campaigns[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1000);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);

  async function generate(): Promise<void> {
    if (!campaignId) {
      setError("Select a campaign first.");
      return;
    }
    if (quantity < 1) {
      setError("Enter how many codes you need.");
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/code-batches/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...brandCsrfHeaders() },
        body: JSON.stringify({
          quantity,
          batchName: "Brand2School codes"
        })
      });
      const data = (await res.json()) as GenerateResult & { message?: string };
      if (!res.ok) {
        setError(data.message ?? "Could not generate codes.");
        return;
      }
      setResult(data);
      onGenerated?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bp-code-setup">
      <div className="bp-code-setup-card bp-code-setup-card--recommended">
        <p className="bp-code-setup-badge">Recommended</p>
        <h3>
          <Sparkles size={18} /> Let Brand2School generate codes
        </h3>
        <p>We securely create unique, non-sequential codes and split them into downloadable packs of 50.</p>
        <label className="bp-inv-select-wrap">
          <span>Campaign</span>
          <select
            className="bp-inv-select"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            disabled={busy || campaigns.length === 0}
          >
            {campaigns.length === 0 ? <option value="">No campaigns</option> : null}
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="bp-inv-select-wrap">
          <span>How many codes do you need?</span>
          <input
            className="bp-inv-select"
            type="number"
            min={1}
            max={50000}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 0)}
            disabled={busy}
          />
        </label>
        <button type="button" className="bp-inv-btn bp-inv-btn--primary" onClick={() => void generate()} disabled={busy}>
          {busy ? <Loader2 size={16} className="ba-spin" /> : <Sparkles size={16} />}
          {busy ? "Generating…" : "Generate codes"}
        </button>
        {error ? <p className="bp-inv-alert">{error}</p> : null}
        {result ? (
          <p className="bp-muted">
            {result.message ??
              `Generated ${result.generatedCount ?? 0} codes in ${result.batchCount ?? 0} packs of ${result.packSize ?? 50}.`}
          </p>
        ) : null}
      </div>
    </div>
  );
}
