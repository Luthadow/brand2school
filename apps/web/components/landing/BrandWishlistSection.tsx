"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCount } from "../../lib/formatCount";
import { FadeIn } from "./FadeIn";
import { SectionHeader } from "./SectionHeader";

type ProvinceOption = { code: string; name: string };

type BrandWishlistBrand = { id: string; name: string };

type BrandWishlistCategory = {
  id: string;
  label: string;
  icon: string;
  brands: BrandWishlistBrand[];
};

type BrandWishlistResults = {
  generatedAt: string;
  totalNominations: number;
  schoolsRegistered: number;
  provincesRepresented: number;
  topBrands: Array<{ rank: number; brandId: string; brandName: string; nominations: number }>;
  categories: BrandWishlistCategory[];
  disclaimer: string;
};

const RANK_MEDALS = ["🥇", "🥈", "🥉"] as const;
const EMPTY_CATEGORIES: BrandWishlistCategory[] = [];

export function BrandWishlistSection(): JSX.Element {
  const [results, setResults] = useState<BrandWishlistResults | null>(null);
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState("supermarkets");
  const [brandId, setBrandId] = useState("");
  const [contactName, setContactName] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const loadResults = useCallback(async (): Promise<void> => {
    const res = await fetch("/api/platform/brand-wishlist", { cache: "no-store" });
    if (!res.ok) return;
    setResults((await res.json()) as BrandWishlistResults);
  }, []);

  useEffect(() => {
    void loadResults();
    void fetch("/api/platform/province-options", { cache: "force-cache" })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => setProvinces(rows as ProvinceOption[]))
      .catch(() => setProvinces([]));
  }, [loadResults]);

  const categories = results?.categories ?? EMPTY_CATEGORIES;
  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeCategoryId) ?? categories[0],
    [categories, activeCategoryId]
  );

  useEffect(() => {
    if (!activeCategory) return;
    if (!activeCategory.brands.some((b) => b.id === brandId)) {
      setBrandId("");
    }
  }, [activeCategory, brandId]);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!brandId) {
      setFeedback({ kind: "err", text: "Select a brand to nominate." });
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/platform/brand-wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          provinceCode,
          contactName: contactName.trim() || undefined,
          schoolName: schoolName.trim() || undefined,
          reason: reason.trim() || undefined,
          source: "homepage"
        })
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setFeedback({ kind: "err", text: data.message ?? "Could not submit nomination." });
        return;
      }
      setFeedback({ kind: "ok", text: data.message ?? "Nomination received. Thank you." });
      setReason("");
      await loadResults();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="brand-wishlist" className="lp-section lp-brand-wishlist">
      <div className="lp-container">
        <FadeIn>
          <SectionHeader
            eyebrow="🇿🇦 South Africa's Brand Wishlist"
            title="Help Decide Which Brand We Should Invite Next"
            subtitle="Brand2School is preparing national customer participation campaigns. Before we approach brands, we want to hear directly from South Africans — which brands would you like to see helping schools and communities through everyday purchases?"
          />
        </FadeIn>

        <div className="lp-brand-wishlist-grid">
          <FadeIn delay={0.06} className="lp-brand-wishlist-form-col">
            <div className="lp-brand-wishlist-intro card">
              <p>
                Your vote helps us understand which brands communities want to engage with next. Share{" "}
                <strong>why</strong> you chose a brand — those responses become valuable community insight for
                future outreach.
              </p>
            </div>

            <form className="lp-brand-wishlist-form card" onSubmit={(e) => void submit(e)}>
              <h3>Choose a category</h3>
              <div className="lp-brand-wishlist-categories" role="tablist" aria-label="Brand categories">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={activeCategoryId === category.id}
                    className={`lp-brand-wishlist-cat${activeCategoryId === category.id ? " lp-brand-wishlist-cat--active" : ""}`}
                    onClick={() => setActiveCategoryId(category.id)}
                  >
                    <span aria-hidden>{category.icon}</span> {category.label}
                  </button>
                ))}
              </div>

              {activeCategory ? (
                <fieldset className="lp-brand-wishlist-brands">
                  <legend>Select your brand</legend>
                  {activeCategory.brands.map((brand) => (
                    <label key={brand.id} className="lp-brand-wishlist-brand">
                      <input
                        type="radio"
                        name="brandId"
                        value={brand.id}
                        checked={brandId === brand.id}
                        onChange={() => setBrandId(brand.id)}
                      />
                      <span>{brand.name}</span>
                    </label>
                  ))}
                </fieldset>
              ) : null}

              <h3>Submit your nomination</h3>
              <div className="lp-brand-wishlist-fields">
                <label>
                  Name <span className="lp-brand-wishlist-optional">(optional)</span>
                  <input value={contactName} onChange={(e) => setContactName(e.target.value)} />
                </label>
                <label>
                  Province
                  <select value={provinceCode} onChange={(e) => setProvinceCode(e.target.value)} required>
                    <option value="">Select province</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="lp-brand-wishlist-field-full">
                  School or community organisation{" "}
                  <span className="lp-brand-wishlist-optional">(optional)</span>
                  <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                </label>
                <label className="lp-brand-wishlist-field-full">
                  Why did you choose this brand?{" "}
                  <span className="lp-brand-wishlist-optional">(optional)</span>
                  <textarea
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Tell us what matters to you — local presence, products you buy every week, trust in your community…"
                  />
                </label>
              </div>

              <button type="submit" className="ds-btn ds-btn-primary" disabled={loading}>
                {loading ? "Submitting…" : "Submit nomination"}
              </button>
              {feedback ? (
                <p
                  className={
                    feedback.kind === "ok"
                      ? "lp-brand-wishlist-feedback lp-brand-wishlist-feedback--ok"
                      : "lp-brand-wishlist-feedback lp-brand-wishlist-feedback--err"
                  }
                >
                  {feedback.text}
                </p>
              ) : null}
            </form>

            <aside className="lp-brand-wishlist-why card">
              <h3>Why are we asking?</h3>
              <p>
                We believe communities should have a voice in shaping future Brand2School campaigns. Your nomination
                helps us understand which brands South Africans would like to see creating measurable impact in
                education.
              </p>
              <p className="lp-brand-wishlist-disclaimer">
                {results?.disclaimer ??
                  "A nomination does not imply that any company is currently affiliated with or has endorsed Brand2School."}
              </p>
            </aside>
          </FadeIn>

          <FadeIn delay={0.12} className="lp-brand-wishlist-results-col">
            <div className="lp-brand-wishlist-results card">
              <h3>Live community results</h3>
              <p className="lp-brand-wishlist-results-sub">Most requested brands</p>
              {results && results.topBrands.length > 0 ? (
                <table className="lp-brand-wishlist-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Brand</th>
                      <th>Community nominations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.topBrands.map((row) => (
                      <tr key={row.brandId}>
                        <td>{RANK_MEDALS[row.rank - 1] ?? row.rank}</td>
                        <td>{row.brandName}</td>
                        <td>{formatCount(row.nominations)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="lp-brand-wishlist-empty">
                  Be the first to nominate a brand — results update live as nominations come in.
                </p>
              )}
              {results ? (
                <p className="lp-brand-wishlist-total">
                  <strong>{formatCount(results.totalNominations)}</strong> community nominations received
                </p>
              ) : null}
            </div>

            <div className="lp-brand-wishlist-impact card">
              <h3>Community impact counter</h3>
              <ul className="lp-brand-wishlist-impact-list">
                <li>
                  <span>🏫</span>
                  <div>
                    <strong>{formatCount(results?.schoolsRegistered ?? 0)}</strong>
                    <span>Schools &amp; community organisations registered</span>
                  </div>
                </li>
                <li>
                  <span>👥</span>
                  <div>
                    <strong>{formatCount(results?.totalNominations ?? 0)}</strong>
                    <span>Community nominations</span>
                  </div>
                </li>
                <li>
                  <span>📍</span>
                  <div>
                    <strong>{formatCount(results?.provincesRepresented ?? 0)}</strong>
                    <span>Provinces represented</span>
                  </div>
                </li>
                <li>
                  <span>🚀</span>
                  <div>
                    <strong>Preparing</strong>
                    <span>National brand campaigns</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="lp-brand-wishlist-cta card">
              <p className="ds-eyebrow">The communities are ready</p>
              <h3>Now we&apos;re inviting visionary brands to build something bigger.</h3>
              <Link href="/for-brands" className="ds-btn ds-btn-primary ds-btn-lg">
                Become a Founding Brand Partner
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
