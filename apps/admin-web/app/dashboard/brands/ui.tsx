"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { csrfFetch } from "../admin-client-utils";
import { useAdminSession } from "../useAdminSession";

type BrandRow = {
  id: string;
  name: string;
  codePrefix: string;
  slug: string;
  status: string;
  logoUrl: string | null;
  featuredOnHome: boolean;
  homeSortOrder: number;
  founderExempt: boolean;
  verificationCode: string | null;
  verificationStatus: string;
  verifiedAt: string | null;
  verifyUrl: string | null;
  certificatePdfUrl: string | null;
  publicProfileEnabled: boolean;
  description: string | null;
  websiteUrl: string | null;
  brandColor: string | null;
  publicProfileUrl?: string;
};

type BrandsResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: BrandRow[];
};

export function BrandsClient(): JSX.Element {
  const { session, loading } = useAdminSession();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BrandsResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [featuredOnHome, setFeaturedOnHome] = useState(false);
  const [homeSortOrder, setHomeSortOrder] = useState(100);
  const [founderExempt, setFounderExempt] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("PENDING");
  const [publicProfileEnabled, setPublicProfileEnabled] = useState(false);
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    return params.toString();
  }, [search, status, page]);

  const loadData = async (): Promise<void> => {
    const res = await csrfFetch(`/api/admin/brands?${query}`);
    if (!res.ok) {
      setToast({ kind: "error", text: "Failed to load brands." });
      return;
    }
    setData((await res.json()) as BrandsResponse);
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const selected = data?.items.find((b) => b.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) return;
    setWebsiteUrl(selected.websiteUrl ?? "");
    setBrandColor(selected.brandColor ?? "");
    setFeaturedOnHome(selected.featuredOnHome);
    setHomeSortOrder(selected.homeSortOrder);
    setFounderExempt(selected.founderExempt);
    setVerificationStatus(selected.verificationStatus);
    setPublicProfileEnabled(selected.publicProfileEnabled);
    setDescription(selected.description ?? "");
    setSlug(selected.slug);
  }, [selected]);

  const saveProfile = async (): Promise<void> => {
    if (!selected) return;
    setSaving(true);
    const res = await csrfFetch(`/api/admin/brands/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        websiteUrl: websiteUrl.trim() ? websiteUrl.trim() : null,
        brandColor: brandColor.trim() ? brandColor.trim() : null,
        featuredOnHome,
        homeSortOrder,
        founderExempt,
        verificationStatus,
        publicProfileEnabled,
        description: description.trim() ? description.trim() : null,
        slug: slug.trim() || undefined
      })
    });
    setSaving(false);
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      setToast({ kind: "error", text: err.message ?? "Save failed." });
      return;
    }
    setToast({ kind: "success", text: "Brand profile updated." });
    setTimeout(() => setToast(null), 2500);
    await loadData();
  };

  const uploadLogo = async (file: File): Promise<void> => {
    if (!selected) return;
    const form = new FormData();
    form.append("logo", file);
    const res = await csrfFetch(`/api/admin/brands/${selected.id}/logo`, {
      method: "POST",
      body: form
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      setToast({ kind: "error", text: err.message ?? "Logo upload failed." });
      return;
    }
    setToast({ kind: "success", text: "Logo uploaded." });
    setTimeout(() => setToast(null), 2500);
    await loadData();
  };

  const removeLogo = async (): Promise<void> => {
    if (!selected) return;
    const res = await csrfFetch(`/api/admin/brands/${selected.id}/logo`, { method: "DELETE" });
    if (!res.ok) {
      setToast({ kind: "error", text: "Could not remove logo." });
      return;
    }
    setToast({ kind: "success", text: "Logo removed." });
    await loadData();
  };

  if (loading || !session) return <p>Loading...</p>;
  if (session.user.role !== "SUPER_ADMIN") {
    return <p>Brand partner management requires SUPER_ADMIN role.</p>;
  }
  if (!data) return <p>Loading brands...</p>;

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <>
      <h1>Brand Partners</h1>
      <p style={{ marginTop: 0, color: "#4a5f7a" }}>
        Upload logos and feature verified ACTIVE brands on the public homepage. PNG, 512×512 minimum, 15MB max.
      </p>

      <div className="card" style={{ marginBottom: "1rem", display: "grid", gap: "0.5rem", gridTemplateColumns: "1fr 1fr auto" }}>
        <input placeholder="Search name or code prefix" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="VERIFIED">VERIFIED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>
        <button onClick={() => setPage(1)}>Apply</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)", gap: "1rem" }}>
        <section className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Logo</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((brand) => (
                  <tr
                    key={brand.id}
                    style={{ cursor: "pointer", background: selectedId === brand.id ? "#eef5ff" : undefined }}
                    onClick={() => setSelectedId(brand.id)}
                  >
                    <td>{brand.name}</td>
                    <td>{brand.status}</td>
                    <td>{brand.featuredOnHome ? "Yes" : "—"}</td>
                    <td>{brand.logoUrl ? "Yes" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
            <button disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>
              Prev
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage((v) => v + 1)}>
              Next
            </button>
          </div>
        </section>

        <section className="card">
          {!selected ? (
            <p>Select a brand to manage logo and homepage visibility.</p>
          ) : (
            <>
              <h2 style={{ marginTop: 0 }}>{selected.name}</h2>
              <p style={{ color: "#4a5f7a", fontSize: "0.9rem" }}>
                Code: {selected.codePrefix} · Slug: {selected.slug} · Status: {selected.status}
              </p>
              {selected.verificationCode ? (
                <p style={{ marginTop: "0.35rem", fontSize: "0.9rem" }}>
                  <strong>Verification:</strong> <code>{selected.verificationCode}</code> ·{" "}
                  {selected.verificationStatus}
                  {selected.verifyUrl ? (
                    <>
                      {" "}
                      ·{" "}
                      <a
                        href={`${process.env.NEXT_PUBLIC_WEB_APP_URL ?? "http://localhost:3000"}${selected.verifyUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Verify page
                      </a>
                    </>
                  ) : null}
                  {selected.certificatePdfUrl ? (
                    <>
                      {" "}
                      ·{" "}
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}${selected.certificatePdfUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Certificate PDF
                      </a>
                    </>
                  ) : null}
                </p>
              ) : null}
              {selected.publicProfileEnabled || selected.featuredOnHome ? (
                <p style={{ marginTop: "0.35rem" }}>
                  <a
                    href={`${process.env.NEXT_PUBLIC_WEB_APP_URL ?? "http://localhost:3000"}/brand/${selected.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View brand profile
                  </a>
                </p>
              ) : null}

              <div style={{ margin: "1rem 0", minHeight: 80, display: "flex", alignItems: "center", gap: "1rem" }}>
                {selected.logoUrl ? (
                  <Image src={selected.logoUrl} alt={`${selected.name} logo`} width={140} height={60} unoptimized />
                ) : (
                  <span style={{ color: "#6b7280" }}>No logo uploaded</span>
                )}
              </div>

              <label style={{ display: "block", marginBottom: "0.75rem" }}>
                Upload logo (PNG)
                <input
                  type="file"
                  accept="image/png"
                  style={{ display: "block", marginTop: "0.35rem", width: "100%" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadLogo(file);
                    e.target.value = "";
                  }}
                />
              </label>

              {selected.logoUrl ? (
                <button type="button" style={{ marginBottom: "1rem" }} onClick={() => void removeLogo()}>
                  Remove logo
                </button>
              ) : null}

              <label style={{ display: "block", marginBottom: "0.75rem" }}>
                Public slug
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="brand-code"
                  style={{ display: "block", marginTop: "0.35rem", width: "100%" }}
                />
              </label>

              <label style={{ display: "block", marginBottom: "0.75rem" }}>
                Public description
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  style={{ display: "block", marginTop: "0.35rem", width: "100%" }}
                />
              </label>

              <label style={{ display: "block", marginBottom: "0.75rem" }}>
                Website URL
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  style={{ display: "block", marginTop: "0.35rem", width: "100%" }}
                />
              </label>

              <label style={{ display: "block", marginBottom: "0.75rem" }}>
                Brand color (hex)
                <input
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  placeholder="#003B8E"
                  style={{ display: "block", marginTop: "0.35rem", width: "100%" }}
                />
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={publicProfileEnabled}
                  disabled={selected.status !== "ACTIVE"}
                  onChange={(e) => setPublicProfileEnabled(e.target.checked)}
                />
                Public partner profile (/partners/slug)
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={featuredOnHome}
                  disabled={selected.status !== "ACTIVE"}
                  onChange={(e) => setFeaturedOnHome(e.target.checked)}
                />
                Featured on homepage (ACTIVE brands with logo only)
              </label>

              <label style={{ display: "block", marginBottom: "0.75rem" }}>
                Verification status
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value)}
                  style={{ display: "block", marginTop: "0.35rem", width: "100%" }}
                >
                  <option value="PENDING">Pending</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="FOUNDER_VERIFIED">Founder verified (lifetime)</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={founderExempt}
                  onChange={(e) => setFounderExempt(e.target.checked)}
                />
                Founder pass (waives R10,000 activation fee gate)
              </label>

              <label style={{ display: "block", marginBottom: "1rem" }}>
                Homepage order (lower = first)
                <input
                  type="number"
                  min={0}
                  max={9999}
                  value={homeSortOrder}
                  onChange={(e) => setHomeSortOrder(Number(e.target.value))}
                  style={{ display: "block", marginTop: "0.35rem", width: "100%" }}
                />
              </label>

              <button disabled={saving} onClick={() => void saveProfile()}>
                {saving ? "Saving…" : "Save profile"}
              </button>
            </>
          )}
        </section>
      </div>

      {toast ? <div className={`toast ${toast.kind}`}>{toast.text}</div> : null}
    </>
  );
}
