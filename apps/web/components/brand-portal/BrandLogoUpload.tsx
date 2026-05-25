"use client";

import { useState } from "react";
import Image from "next/image";
import { brandCsrfHeaders } from "../../lib/brandClientFetch";

type Props = {
  logoUrl: string | null;
  brandName: string;
  onUpdated: (logoUrl: string | null) => void;
};

export function BrandLogoUpload({ logoUrl, brandName, onUpdated }: Props): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const upload = async (file: File): Promise<void> => {
    setLoading(true);
    setError(null);
    setMessage(null);
    const form = new FormData();
    form.append("logo", file);
    try {
      const res = await fetch("/api/brand/logo", {
        method: "POST",
        headers: brandCsrfHeaders(),
        body: form
      });
      const data = (await res.json()) as { message?: string; logoUrl?: string | null };
      if (!res.ok) {
        setError(data.message ?? "Upload failed.");
        return;
      }
      onUpdated(data.logoUrl ?? null);
      setMessage(data.message ?? "Logo uploaded.");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/brand/logo", {
        method: "DELETE",
        headers: brandCsrfHeaders()
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? "Could not remove logo.");
        return;
      }
      onUpdated(null);
      setMessage(data.message ?? "Logo removed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem", minHeight: 72 }}>
        {logoUrl ? (
          <Image src={logoUrl} alt={`${brandName} logo`} width={140} height={56} unoptimized style={{ objectFit: "contain" }} />
        ) : (
          <span className="bp-muted">No logo uploaded yet</span>
        )}
      </div>
      <label className="bp-muted" style={{ display: "block" }}>
        Upload logo (PNG, min 512×512, max 2MB)
        <input
          type="file"
          accept="image/png"
          disabled={loading}
          style={{ display: "block", marginTop: "0.35rem", maxWidth: "100%" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
      </label>
      {logoUrl ? (
        <button type="button" className="bp-logout" style={{ marginTop: "0.5rem" }} disabled={loading} onClick={() => void remove()}>
          Remove logo
        </button>
      ) : null}
      {error ? <p className="reg-error" style={{ marginTop: "0.5rem" }}>{error}</p> : null}
      {message ? <p style={{ marginTop: "0.5rem" }}>{message}</p> : null}
      <p className="bp-muted" style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
        Your logo can appear on the homepage and partner directory once Brand2School enables public featuring.
      </p>
    </div>
  );
}
