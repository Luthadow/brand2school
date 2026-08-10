"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { brandCsrfHeaders } from "../../lib/brandClientFetch";
import {
  ACTIVATION_CHECKLIST_LABELS,
  buildCreateCampaignPayload,
  defaultCampaignDraft,
  slugPreviewFromName,
  WIZARD_STEPS,
  type ActivationGate,
  type CampaignBuilderDraft,
  type ProvinceOption,
  type WizardStepKey
} from "../../lib/campaignBuilder";
import { formatCount } from "../../lib/formatCount";
import { NEED_CATEGORIES } from "../../lib/brandPortal";
import { useBrandPortal } from "./BrandPortalContext";
import { BrandPageHeader } from "./BrandPageHeader";

type CreatedCampaign = { id: string; name: string; slug: string; commercialStatus: string };

function stepIndex(key: WizardStepKey): number {
  return WIZARD_STEPS.findIndex((s) => s.key === key);
}

function validateStep(step: WizardStepKey, draft: CampaignBuilderDraft): string | null {
  if (step === "basics") {
    if (draft.name.trim().length < 4) return "Campaign name must be at least 4 characters.";
    if (!draft.startsAt || !draft.endsAt) return "Set campaign start and end dates.";
    if (new Date(draft.endsAt) <= new Date(draft.startsAt)) return "End date must be after start date.";
  }
  if (step === "impact") {
    if (!draft.category) return "Select an infrastructure category.";
    if (draft.targetSubmissions < 1) return "Set a participation target of at least 1.";
    if (draft.contributionPerCodeZar <= 0) return "Contribution per code must be greater than zero.";
  }
  if (step === "territory") {
    if (draft.scopeType === "PROVINCIAL" && draft.allowedProvinces.length === 0) {
      return "Select at least one province for a provincial campaign.";
    }
  }
  return null;
}

export function CampaignBuilderWizard(): JSX.Element {
  const { brand } = useBrandPortal();
  const [step, setStep] = useState<WizardStepKey>("basics");
  const [draft, setDraft] = useState<CampaignBuilderDraft>(defaultCampaignDraft);
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedCampaign | null>(null);
  const [activation, setActivation] = useState<ActivationGate | null>(null);

  useEffect(() => {
    void fetch("/api/campaigns/province-options", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => setProvinces(Array.isArray(rows) ? rows : []))
      .catch(() => setProvinces([]));
  }, []);

  const slugPreview = useMemo(() => slugPreviewFromName(draft.name), [draft.name]);
  const currentStepIndex = stepIndex(step);

  function updateDraft<K extends keyof CampaignBuilderDraft>(key: K, value: CampaignBuilderDraft[K]): void {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function toggleProvince(code: string): void {
    setDraft((prev) => {
      const selected = prev.allowedProvinces.includes(code)
        ? prev.allowedProvinces.filter((c) => c !== code)
        : [...prev.allowedProvinces, code];
      return { ...prev, allowedProvinces: selected };
    });
  }

  function addProductRow(): void {
    setDraft((prev) => ({ ...prev, products: [...prev.products, { name: "", sku: "" }] }));
  }

  function removeProductRow(index: number): void {
    setDraft((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  }

  function updateProduct(index: number, field: "name" | "sku", value: string): void {
    setDraft((prev) => ({
      ...prev,
      products: prev.products.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    }));
  }

  function goNext(): void {
    const message = validateStep(step, draft);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    const next = WIZARD_STEPS[currentStepIndex + 1];
    if (next) setStep(next.key);
  }

  function goBack(): void {
    setError(null);
    const prev = WIZARD_STEPS[currentStepIndex - 1];
    if (prev) setStep(prev.key);
  }

  async function submitCampaign(): Promise<void> {
    for (const s of WIZARD_STEPS) {
      if (s.key === "review") continue;
      const message = validateStep(s.key, draft);
      if (message) {
        setError(message);
        setStep(s.key);
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = buildCreateCampaignPayload(draft, brand.id);
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...brandCsrfHeaders() },
        body: JSON.stringify(payload)
      });
      const data = (await res.json()) as CreatedCampaign & { message?: string };
      if (!res.ok) {
        setError(data.message ?? "Could not create campaign.");
        return;
      }

      const productRows = draft.products.filter((p) => p.name.trim().length >= 2);
      for (const product of productRows) {
        await fetch(`/api/campaigns/${data.id}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...brandCsrfHeaders() },
          body: JSON.stringify({
            name: product.name.trim(),
            sku: product.sku.trim() || undefined
          })
        });
      }

      const activationRes = await fetch(`/api/campaigns/${data.id}/activation`, { cache: "no-store" });
      if (activationRes.ok) {
        setActivation((await activationRes.json()) as ActivationGate);
      }

      setCreated({ id: data.id, name: data.name, slug: data.slug, commercialStatus: data.commercialStatus });
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="bp-page">
        <article className="bp-panel bp-wizard-success">
          <CheckCircle2 size={40} />
          <h1>Campaign created</h1>
          <p>
            <strong>{created.name}</strong> is saved as <span className="bp-pill bp-pill--pending">DRAFT</span>. Complete
            the steps below to go live.
          </p>
          {activation ? (
            <ul className="bp-wizard-checklist">
              {(Object.keys(activation.checklist) as Array<keyof ActivationGate["checklist"]>).map((key) => (
                <li key={key} className={activation.checklist[key] ? "bp-wizard-checklist--done" : ""}>
                  {activation.checklist[key] ? "✓" : "○"} {ACTIVATION_CHECKLIST_LABELS[key]}
                </li>
              ))}
            </ul>
          ) : null}
          {activation && activation.blockers.length > 0 ? (
            <div className="bp-wizard-blockers">
              <strong>Before going LIVE</strong>
              <ul>
                {activation.blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="bp-wizard-success-actions">
            <Link href={"/brand/dashboard/inventory" as Route} className="bp-inv-btn bp-inv-btn--primary">
              Set up campaign codes
            </Link>
            <Link href={"/brand/dashboard/commercial" as Route} className="bp-inv-btn">
              View agreement
            </Link>
            <Link href={"/brand/dashboard/campaigns" as Route} className="bp-inv-btn">
              Back to campaigns
            </Link>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="bp-page">
      <BrandPageHeader
        eyebrow="Campaign Builder"
        title="Create a new campaign"
        description="Define your participation mechanic, impact goals, products, and territory — then upload codes to go live."
        actions={
          <Link href={"/brand/dashboard/campaigns" as Route} className="bp-inv-btn">
            <ArrowLeft size={16} />
            Cancel
          </Link>
        }
      />

      <nav className="bp-wizard-steps" aria-label="Campaign builder steps">
        {WIZARD_STEPS.map((s, i) => (
          <span
            key={s.key}
            className={`bp-wizard-step${i === currentStepIndex ? " bp-wizard-step--active" : ""}${i < currentStepIndex ? " bp-wizard-step--done" : ""}`}
          >
            <span className="bp-wizard-step-num">{i + 1}</span>
            {s.label}
          </span>
        ))}
      </nav>

      <article className="bp-panel bp-wizard-panel">
        {step === "basics" ? (
          <div className="bp-wizard-form">
            <h2>Campaign basics</h2>
            <p className="bp-muted">Name your campaign and set the participation window.</p>
            <label className="bp-wizard-field">
              <span>Campaign name</span>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => updateDraft("name", e.target.value)}
                placeholder="e.g. Buy a 2L and support school libraries"
              />
            </label>
            {slugPreview ? <p className="bp-muted">URL slug preview: {slugPreview}</p> : null}
            <label className="bp-wizard-field">
              <span>Campaign description (optional)</span>
              <textarea
                rows={3}
                value={draft.description}
                onChange={(e) => updateDraft("description", e.target.value)}
                placeholder="What should schools and parents know about this campaign?"
              />
            </label>
            <div className="bp-wizard-row">
              <label className="bp-wizard-field">
                <span>Start date</span>
                <input
                  type="date"
                  value={draft.startsAt}
                  onChange={(e) => updateDraft("startsAt", e.target.value)}
                />
              </label>
              <label className="bp-wizard-field">
                <span>End date</span>
                <input
                  type="date"
                  value={draft.endsAt}
                  onChange={(e) => updateDraft("endsAt", e.target.value)}
                />
              </label>
            </div>
          </div>
        ) : null}

        {step === "impact" ? (
          <div className="bp-wizard-form">
            <h2>Impact &amp; goals</h2>
            <p className="bp-muted">Tell us what infrastructure this campaign funds and how you will measure success.</p>
            <label className="bp-wizard-field">
              <span>Infrastructure category</span>
              <select value={draft.category} onChange={(e) => updateDraft("category", e.target.value)}>
                {NEED_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="bp-wizard-field">
              <span>Infrastructure goal</span>
              <input
                type="text"
                value={draft.infrastructureGoal}
                onChange={(e) => updateDraft("infrastructureGoal", e.target.value)}
                placeholder={`e.g. Fund ${draft.category.toLowerCase()} at 50 schools`}
              />
            </label>
            <div className="bp-wizard-row">
              <label className="bp-wizard-field">
                <span>Target verified submissions</span>
                <input
                  type="number"
                  min={1}
                  value={draft.targetSubmissions}
                  onChange={(e) => updateDraft("targetSubmissions", Number(e.target.value) || 0)}
                />
              </label>
              <label className="bp-wizard-field">
                <span>Contribution per code (ZAR)</span>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={draft.contributionPerCodeZar}
                  onChange={(e) => updateDraft("contributionPerCodeZar", Number(e.target.value) || 0)}
                />
              </label>
            </div>
            <label className="bp-wizard-field">
              <span>Transformation pool budget (ZAR, optional)</span>
              <input
                type="number"
                min={0}
                value={draft.contributionPoolZar}
                onChange={(e) => updateDraft("contributionPoolZar", e.target.value)}
                placeholder="e.g. 500000"
              />
            </label>
          </div>
        ) : null}

        {step === "products" ? (
          <div className="bp-wizard-form">
            <h2>Participating products</h2>
            <p className="bp-muted">
              List the SKUs or product lines that carry participation codes. You can skip this and add products later.
            </p>
            {draft.products.map((product, index) => (
              <div key={index} className="bp-wizard-product-row">
                <label className="bp-wizard-field">
                  <span>Product name</span>
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) => updateProduct(index, "name", e.target.value)}
                    placeholder="e.g. 2L Energy Drink"
                  />
                </label>
                <label className="bp-wizard-field">
                  <span>SKU (optional)</span>
                  <input
                    type="text"
                    value={product.sku}
                    onChange={(e) => updateProduct(index, "sku", e.target.value)}
                    placeholder="e.g. ASTR-2L-001"
                  />
                </label>
                {draft.products.length > 1 ? (
                  <button
                    type="button"
                    className="bp-wizard-icon-btn"
                    onClick={() => removeProductRow(index)}
                    aria-label="Remove product"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>
            ))}
            <button type="button" className="bp-inv-btn" onClick={addProductRow}>
              <Plus size={16} />
              Add product
            </button>
          </div>
        ) : null}

        {step === "territory" ? (
          <div className="bp-wizard-form">
            <h2>Territory &amp; budget</h2>
            <p className="bp-muted">Choose where schools can participate and optional spend caps.</p>
            <div className="bp-wizard-scope">
              <label className={`bp-wizard-scope-card${draft.scopeType === "NATIONAL" ? " bp-wizard-scope-card--active" : ""}`}>
                <input
                  type="radio"
                  name="scopeType"
                  checked={draft.scopeType === "NATIONAL"}
                  onChange={() => updateDraft("scopeType", "NATIONAL")}
                />
                <strong>National</strong>
                <span>All provinces — maximum reach</span>
              </label>
              <label className={`bp-wizard-scope-card${draft.scopeType === "PROVINCIAL" ? " bp-wizard-scope-card--active" : ""}`}>
                <input
                  type="radio"
                  name="scopeType"
                  checked={draft.scopeType === "PROVINCIAL"}
                  onChange={() => updateDraft("scopeType", "PROVINCIAL")}
                />
                <strong>Provincial</strong>
                <span>Target specific provinces</span>
              </label>
            </div>
            {draft.scopeType === "PROVINCIAL" ? (
              <div className="bp-wizard-provinces">
                {provinces.map((p) => (
                  <label key={p.code} className="bp-wizard-province">
                    <input
                      type="checkbox"
                      checked={draft.allowedProvinces.includes(p.code)}
                      onChange={() => toggleProvince(p.code)}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            ) : null}
            <label className="bp-wizard-field">
              <span>Campaign budget cap (ZAR, optional)</span>
              <input
                type="number"
                min={0}
                value={draft.budgetAllocatedZar}
                onChange={(e) => updateDraft("budgetAllocatedZar", e.target.value)}
                placeholder="Pause submissions when budget is exhausted"
              />
            </label>
            <label className="bp-wizard-check">
              <input
                type="checkbox"
                checked={draft.pauseOnBudgetExhausted}
                onChange={(e) => updateDraft("pauseOnBudgetExhausted", e.target.checked)}
              />
              Pause campaign automatically when budget is exhausted
            </label>
          </div>
        ) : null}

        {step === "review" ? (
          <div className="bp-wizard-form">
            <h2>Review &amp; create</h2>
            <p className="bp-muted">Your campaign will be created as a draft. Upload codes and complete agreement steps to go LIVE.</p>
            <dl className="bp-wizard-review">
              <div>
                <dt>Campaign</dt>
                <dd>{draft.name}</dd>
              </div>
              <div>
                <dt>Dates</dt>
                <dd>
                  {draft.startsAt} → {draft.endsAt}
                </dd>
              </div>
              <div>
                <dt>Impact</dt>
                <dd>
                  {draft.infrastructureGoal || draft.category} · target {formatCount(draft.targetSubmissions)} submissions
                </dd>
              </div>
              <div>
                <dt>Territory</dt>
                <dd>
                  {draft.scopeType === "NATIONAL"
                    ? "National"
                    : draft.allowedProvinces
                        .map((code) => provinces.find((p) => p.code === code)?.name ?? code)
                        .join(", ")}
                </dd>
              </div>
              <div>
                <dt>Products</dt>
                <dd>
                  {draft.products.filter((p) => p.name.trim()).length > 0
                    ? draft.products
                        .filter((p) => p.name.trim())
                        .map((p) => p.name)
                        .join(", ")
                    : "None yet — add when uploading codes"}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        {error ? <p className="bp-wizard-error">{error}</p> : null}

        <footer className="bp-wizard-footer">
          {currentStepIndex > 0 ? (
            <button type="button" className="bp-inv-btn" onClick={goBack} disabled={submitting}>
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <span />
          )}
          {step === "review" ? (
            <button type="button" className="bp-inv-btn bp-inv-btn--primary" onClick={() => void submitCampaign()} disabled={submitting}>
              {submitting ? <Loader2 size={16} className="ba-spin" /> : <CheckCircle2 size={16} />}
              {submitting ? "Creating…" : "Create campaign"}
            </button>
          ) : (
            <button type="button" className="bp-inv-btn bp-inv-btn--primary" onClick={goNext}>
              Continue
              <ArrowRight size={16} />
            </button>
          )}
        </footer>
      </article>
    </div>
  );
}
