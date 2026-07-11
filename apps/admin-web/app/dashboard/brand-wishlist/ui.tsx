"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { csrfFetch } from "../admin-client-utils";
import { useAdminSession } from "../useAdminSession";

type BrandSummaryRow = {
  brandId: string;
  brandName: string;
  categoryId: string;
  categoryLabel: string;
  nominations: number;
  commentsCount: number;
};

type SummaryResponse = {
  generatedAt: string;
  totalNominations: number;
  nominationsWithComments: number;
  brands: BrandSummaryRow[];
};

type NominationRow = {
  id: string;
  categoryId: string;
  categoryLabel: string;
  brandId: string;
  brandName: string;
  provinceCode: string;
  provinceName: string;
  contactName: string | null;
  schoolName: string | null;
  reason: string | null;
  source: string;
  createdAt: string;
};

type NominationsResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: NominationRow[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function BrandWishlistClient(): JSX.Element {
  const { session, loading } = useAdminSession();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [nominations, setNominations] = useState<NominationsResponse | null>(null);
  const [brandFilter, setBrandFilter] = useState("");
  const [commentsOnly, setCommentsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: "25" });
    if (brandFilter) params.set("brandId", brandFilter);
    if (commentsOnly) params.set("commentsOnly", "true");
    return params.toString();
  }, [brandFilter, commentsOnly, page]);

  const loadSummary = useCallback(async (): Promise<void> => {
    const res = await csrfFetch("/api/admin/brand-wishlist/summary");
    if (!res.ok) {
      setError("Failed to load wishlist summary.");
      return;
    }
    setSummary((await res.json()) as SummaryResponse);
  }, []);

  const loadNominations = useCallback(async (): Promise<void> => {
    const res = await csrfFetch(`/api/admin/brand-wishlist/nominations?${query}`);
    if (!res.ok) {
      setError("Failed to load nominations.");
      return;
    }
    setNominations((await res.json()) as NominationsResponse);
  }, [query]);

  useEffect(() => {
    if (loading || !session) return;
    void loadSummary();
  }, [loading, session, loadSummary]);

  useEffect(() => {
    if (loading || !session) return;
    void loadNominations();
  }, [loading, session, loadNominations]);

  if (loading || !session) {
    return <p>Loading…</p>;
  }

  const totalPages = nominations ? Math.max(1, Math.ceil(nominations.total / nominations.pageSize)) : 1;

  return (
    <div className="admin-dashboard">
      <header className="admin-page-head">
        <div>
          <p className="admin-page-head__eyebrow">Community outreach</p>
          <h1>Brand Wishlist</h1>
          <p className="admin-page-head__sub">
            Homepage brand nominations — browse written comments and download a PDF outreach report for every brand.
          </p>
        </div>
        {summary ? (
          <time className="admin-page-head__time" dateTime={summary.generatedAt}>
            Updated {formatDate(summary.generatedAt)}
          </time>
        ) : null}
      </header>

      {error ? (
        <p className="admin-alert admin-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {summary ? (
        <section className="card">
          <h2>Overview</h2>
          <div className="admin-kpi-grid">
            <article className="admin-kpi-card">
              <p className="admin-kpi-card__label">Total nominations</p>
              <p className="admin-kpi-card__value">{summary.totalNominations}</p>
            </article>
            <article className="admin-kpi-card">
              <p className="admin-kpi-card__label">With written comments</p>
              <p className="admin-kpi-card__value">{summary.nominationsWithComments}</p>
            </article>
            <article className="admin-kpi-card">
              <p className="admin-kpi-card__label">Brands nominated</p>
              <p className="admin-kpi-card__value">{summary.brands.filter((b) => b.nominations > 0).length}</p>
            </article>
          </div>
        </section>
      ) : null}

      {summary ? (
        <section className="card">
          <h2>Brands by nominations</h2>
          <p>Download a PDF outreach report for any brand in the wishlist catalogue.</p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Nominations</th>
                  <th>Comments</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {summary.brands.map((brand) => (
                  <tr key={brand.brandId}>
                    <td>{brand.brandName}</td>
                    <td>{brand.categoryLabel}</td>
                    <td>{brand.nominations}</td>
                    <td>{brand.commentsCount}</td>
                    <td>
                      <a
                        href={`/api/admin/brand-wishlist/brands/${encodeURIComponent(brand.brandId)}/report/pdf`}
                        className="admin-sidebar__pdf"
                        title={`Download ${brand.brandName} wishlist PDF`}
                      >
                        PDF
                      </a>
                      {brand.nominations > 0 ? (
                        <button
                          type="button"
                          style={{ marginLeft: "0.5rem", fontSize: "0.8rem" }}
                          onClick={() => {
                            setBrandFilter(brand.brandId);
                            setPage(1);
                          }}
                        >
                          View
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="card">
        <h2>Nominations &amp; comments</h2>
        <div className="admin-filters" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <label>
            Brand{" "}
            <select
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All brands</option>
              {summary?.brands.map((b) => (
                <option key={b.brandId} value={b.brandId}>
                  {b.brandName}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={commentsOnly}
              onChange={(e) => {
                setCommentsOnly(e.target.checked);
                setPage(1);
              }}
            />
            Comments only
          </label>
          {brandFilter || commentsOnly ? (
            <button
              type="button"
              onClick={() => {
                setBrandFilter("");
                setCommentsOnly(false);
                setPage(1);
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Brand</th>
                <th>Province</th>
                <th>Nominator</th>
                <th>Why this brand?</th>
              </tr>
            </thead>
            <tbody>
              {(nominations?.items ?? []).map((row) => (
                <tr key={row.id} className={row.reason?.trim() ? "admin-row--highlight" : undefined}>
                  <td>{formatDate(row.createdAt)}</td>
                  <td>
                    {row.brandName}
                    <br />
                    <small>{row.categoryLabel}</small>
                  </td>
                  <td>{row.provinceName}</td>
                  <td>
                    {row.contactName ?? "—"}
                    {row.schoolName ? (
                      <>
                        <br />
                        <small>{row.schoolName}</small>
                      </>
                    ) : null}
                  </td>
                  <td>
                    {row.reason?.trim() ? (
                      <blockquote className="admin-comment">{row.reason.trim()}</blockquote>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
              {nominations && nominations.items.length === 0 ? (
                <tr>
                  <td colSpan={5}>No nominations match the current filters.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {nominations && nominations.total > nominations.pageSize ? (
          <div className="admin-pagination" style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>
              Page {page} of {totalPages} ({nominations.total} total)
            </span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
