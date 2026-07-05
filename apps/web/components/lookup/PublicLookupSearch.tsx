"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { Search, Building2, School } from "lucide-react";
import type { PublicSearchResponse } from "../../lib/platformPublic";
import { brandLogoDisplayPath } from "../../lib/brandLogoSrc";

type SearchType = "all" | "school" | "brand";

function statusClass(status: string): string {
  if (status === "ACTIVE" || status === "APPROVED") return "lookup-status lookup-status--active";
  if (status === "VERIFIED") return "lookup-status lookup-status--verified";
  return "lookup-status lookup-status--pending";
}

export function PublicLookupSearch({
  compact = false,
  defaultType = "all"
}: {
  compact?: boolean;
  defaultType?: SearchType;
}): JSX.Element {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<SearchType>(defaultType);
  const [results, setResults] = useState<PublicSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setError(null);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const params = new URLSearchParams({ q: trimmed, type });
          const res = await fetch(`/api/platform/search?${params.toString()}`, { cache: "no-store" });
          const json = (await res.json().catch(() => ({}))) as PublicSearchResponse & { message?: string };
          if (!res.ok) {
            setResults(null);
            setError(json.message ?? "Search failed. Try again.");
            setSearched(true);
            return;
          }
          setResults(json);
          setSearched(true);
        } catch {
          setResults(null);
          setError("Search is temporarily unavailable.");
          setSearched(true);
        } finally {
          setLoading(false);
        }
      })();
    }, 350);

    return () => window.clearTimeout(handle);
  }, [query, type]);

  const totalHits = (results?.schools.length ?? 0) + (results?.brands.length ?? 0);

  return (
    <div className={`lookup-search${compact ? " lookup-search--compact" : ""}`}>
      <div className="lookup-search__bar">
        <Search size={18} className="lookup-search__icon" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by school or brand name, district, or province…"
          className="lookup-search__input"
          aria-label="Search schools and brands"
          autoComplete="off"
        />
      </div>

      <div className="lookup-search__filters" role="tablist" aria-label="Search filter">
        {(["all", "school", "brand"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={type === option}
            className={`lookup-search__filter${type === option ? " lookup-search__filter--active" : ""}`}
            onClick={() => setType(option)}
          >
            {option === "all" ? "All" : option === "school" ? "Schools" : "Brands"}
          </button>
        ))}
      </div>

      {query.trim().length > 0 && query.trim().length < 2 ? (
        <p className="lookup-search__hint">Type at least 2 characters to search.</p>
      ) : null}

      {loading ? <p className="lookup-search__hint">Searching…</p> : null}
      {error ? <p className="lookup-search__error">{error}</p> : null}

      {searched && !loading && !error && results ? (
        <div className="lookup-search__results">
          {totalHits === 0 ? (
            <div className="lookup-empty">
              <p>No matching schools or brands found for &ldquo;{results.query}&rdquo;.</p>
              <p>
                Your organisation may not be registered yet.{" "}
                <Link href="/organisations/register">Register your school or organisation</Link>
                {" · "}
                <Link href="/for-brands">Brand partners</Link>
              </p>
            </div>
          ) : (
            <>
              {results.schools.length > 0 ? (
                <section className="lookup-group">
                  <h3 className="lookup-group__title">
                    <School size={16} aria-hidden />
                    Schools &amp; organisations ({results.schools.length})
                  </h3>
                  <ul className="lookup-list">
                    {results.schools.map((school) => (
                      <li key={`${school.name}-${school.address}`} className="lookup-card">
                        <div className="lookup-card__main">
                          <p className="lookup-card__name">{school.name}</p>
                          <p className="lookup-card__meta">{school.address}</p>
                          <p className="lookup-card__meta">{school.organizationLabel}</p>
                        </div>
                        <span className={statusClass(school.status)}>{school.statusLabel}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {results.brands.length > 0 ? (
                <section className="lookup-group">
                  <h3 className="lookup-group__title">
                    <Building2 size={16} aria-hidden />
                    Brand partners ({results.brands.length})
                  </h3>
                  <ul className="lookup-list">
                    {results.brands.map((brand) => (
                      <li key={brand.slug} className="lookup-card lookup-card--brand">
                        {brand.logoUrl ? (
                          <Image
                            src={brandLogoDisplayPath(brand.slug)}
                            alt=""
                            width={40}
                            height={40}
                            className="lookup-card__logo"
                          />
                        ) : (
                          <div className="lookup-card__logo lookup-card__logo--placeholder" aria-hidden>
                            {brand.name.slice(0, 1)}
                          </div>
                        )}
                        <div className="lookup-card__main">
                          <p className="lookup-card__name">{brand.name}</p>
                          {brand.description ? (
                            <p className="lookup-card__meta">{brand.description.slice(0, 120)}</p>
                          ) : (
                            <p className="lookup-card__meta">Participating brand partner</p>
                          )}
                        </div>
                        <Link href={`/brand/${brand.slug}` as Route} className="lookup-card__link">
                          View profile
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
