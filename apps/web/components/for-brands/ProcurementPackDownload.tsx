"use client";

import { useState } from "react";
import { Download, FileArchive } from "lucide-react";
import type { TerritorialPackageId } from "../../lib/territorialPackages";

type Props = {
  /** Highlight a package in the pricing PDF (optional). */
  packageId?: TerritorialPackageId;
  className?: string;
  style?: React.CSSProperties;
  variant?: "primary" | "secondary";
  label?: string;
};

export function ProcurementPackDownload({
  packageId,
  className = "",
  style,
  variant = "secondary",
  label = "Download partnership pack (ZIP)"
}: Props): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const qs = packageId ? `?package=${encodeURIComponent(packageId)}` : "";
      const res = await fetch(`/api/commercial/procurement-pack${qs}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "Could not download partnership pack.");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition");
      const filename =
        disposition?.match(/filename="([^"]+)"/)?.[1] ?? "Brand2School-Partnership-Pack.zip";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setLoading(false);
    }
  };

  const btnClass =
    variant === "primary" ? "ds-btn ds-btn-primary ds-btn-lg" : "ds-btn ds-btn-secondary ds-btn-lg";

  return (
    <div className={className} style={style}>
      <button
        type="button"
        className={`${btnClass} ${loading ? "ds-btn--loading" : ""}`}
        onClick={() => void download()}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? (
          "Preparing pack…"
        ) : (
          <>
            <Download size={18} aria-hidden style={{ marginRight: "0.35rem", verticalAlign: "middle" }} />
            {label}
          </>
        )}
      </button>
      {error ? (
        <p className="ds-form-error" style={{ marginTop: "0.5rem" }}>
          {error}
        </p>
      ) : (
        <p className="lp-muted" style={{ marginTop: "0.5rem", fontSize: "0.85rem", maxWidth: "28rem" }}>
          <FileArchive size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
          ZIP for procurement: company profile, live pricing, agreement template, ESG framework, POPIA summary,
          FAQ.
        </p>
      )}
    </div>
  );
}
