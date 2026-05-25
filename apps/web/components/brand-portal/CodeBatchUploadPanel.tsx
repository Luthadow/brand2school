"use client";

import { useCallback, useState } from "react";
import { Download, FileCheck, FileUp } from "lucide-react";
import { brandCsrfHeaders } from "../../lib/brandClientFetch";

type CampaignOption = { id: string; name: string };

type ValidationReport = {
  brandPrefix: string;
  source: string;
  rowCount: number;
  codesFound: number;
  uniqueCount: number;
  duplicateInFileCount: number;
  validCount: number;
  invalidCount: number;
  alreadyInDatabaseCount: number;
  readyToImportCount: number;
  invalidSample: string[];
};

type Props = {
  campaigns: CampaignOption[];
};

export function CodeBatchUploadPanel({ campaigns }: Props): JSX.Element {
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? "");
  const [batchName, setBatchName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<"validate" | "import" | null>(null);

  const buildFormData = useCallback((): FormData | null => {
    if (!campaignId || !file || batchName.trim().length < 2) return null;
    const form = new FormData();
    form.append("file", file);
    form.append("batchName", batchName.trim());
    if (expiresAt) form.append("expiresAt", new Date(expiresAt).toISOString());
    return form;
  }, [batchName, campaignId, expiresAt, file]);

  const validateFile = async (): Promise<void> => {
    const form = buildFormData();
    if (!form || !file) {
      setMessage("Choose a campaign, batch name (2+ characters), and a file.");
      return;
    }
    setBusy("validate");
    setMessage(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/code-batches/validate-file`, {
        method: "POST",
        headers: brandCsrfHeaders(),
        body: form
      });
      const data = (await res.json()) as ValidationReport & { message?: string };
      if (!res.ok) {
        setReport(null);
        setMessage(data.message ?? "Could not validate file.");
        return;
      }
      setReport(data);
      setMessage(null);
    } finally {
      setBusy(null);
    }
  };

  const importFile = async (): Promise<void> => {
    const form = buildFormData();
    if (!form) {
      setMessage("Choose a campaign, batch name, and file before importing.");
      return;
    }
    setBusy("import");
    setMessage(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/code-batches/import`, {
        method: "POST",
        headers: brandCsrfHeaders(),
        body: form
      });
      const data = (await res.json()) as {
        message?: string;
        importedCount?: number;
        skippedExistingCount?: number;
        validation?: ValidationReport;
      };
      if (!res.ok) {
        if (data.validation) setReport(data.validation);
        setMessage(data.message ?? "Import failed.");
        return;
      }
      setReport(data.validation ?? report);
      setMessage(
        `Imported ${data.importedCount ?? 0} new codes` +
          (data.skippedExistingCount ? ` (${data.skippedExistingCount} already in the system).` : ".")
      );
      setFile(null);
    } finally {
      setBusy(null);
    }
  };

  const downloadTemplate = (): void => {
    if (!campaignId) return;
    window.location.href = `/api/campaigns/${campaignId}/code-batches/import-template`;
  };

  if (campaigns.length === 0) {
    return (
      <article className="bp-panel">
        <h2>Upload product codes</h2>
        <p className="bp-muted">Create a campaign first, then upload Excel, CSV, or Word lists of codes.</p>
      </article>
    );
  }

  return (
    <article className="bp-panel" style={{ marginTop: "1.25rem" }}>
      <h2>Upload product codes</h2>
      <p className="bp-muted" style={{ marginBottom: "1rem" }}>
        Submit codes from Excel (.xlsx, .xls), CSV, or Word (.docx). Use one column named{" "}
        <strong>code</strong> in spreadsheets, or list codes in a Word document (one per line or in a table).
        The system checks each code against your brand prefix before import.
      </p>

      <div style={{ display: "grid", gap: "0.75rem", maxWidth: "32rem" }}>
        <label>
          <span className="bp-muted">Campaign</span>
          <select
            value={campaignId}
            onChange={(e) => {
              setCampaignId(e.target.value);
              setReport(null);
            }}
            style={{ display: "block", width: "100%", marginTop: "0.25rem", padding: "0.5rem" }}
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="bp-muted">Batch name</span>
          <input
            type="text"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            placeholder="e.g. March 2026 bottle caps"
            style={{ display: "block", width: "100%", marginTop: "0.25rem", padding: "0.5rem" }}
          />
        </label>

        <label>
          <span className="bp-muted">Optional expiry</span>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: "0.25rem", padding: "0.5rem" }}
          />
        </label>

        <label>
          <span className="bp-muted">File (Excel, CSV, or Word)</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv,.docx,.txt"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setReport(null);
            }}
            style={{ display: "block", marginTop: "0.25rem" }}
          />
        </label>
      </div>

      <div className="bp-page-actions" style={{ marginTop: "1rem", flexWrap: "wrap" }}>
        <button type="button" className="bp-logout" onClick={downloadTemplate} disabled={!campaignId}>
          <Download size={16} aria-hidden />
          Download template
        </button>
        <button
          type="button"
          className="bp-logout"
          onClick={() => void validateFile()}
          disabled={busy !== null || !file}
        >
          <FileCheck size={16} aria-hidden />
          {busy === "validate" ? "Checking…" : "Check file"}
        </button>
        <button
          type="button"
          className="bp-nav-link bp-nav-link--active"
          style={{ border: "none", cursor: "pointer" }}
          onClick={() => void importFile()}
          disabled={busy !== null || !file || !report || report.invalidCount > 0}
          title={
            report?.invalidCount
              ? "Fix invalid codes before importing"
              : "Import after a successful check"
          }
        >
          <FileUp size={16} aria-hidden />
          {busy === "import" ? "Importing…" : "Import codes"}
        </button>
      </div>

      {message ? (
        <p style={{ marginTop: "1rem" }} role="status">
          {message}
        </p>
      ) : null}

      {report ? (
        <div style={{ marginTop: "1rem", fontSize: "0.95rem" }}>
          <p>
            <strong>Prefix:</strong> {report.brandPrefix} · <strong>Source:</strong> {report.source}
          </p>
          <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
            <li>{report.codesFound} codes read ({report.uniqueCount} unique)</li>
            <li>{report.validCount} valid for your brand</li>
            <li>{report.invalidCount} invalid format or wrong brand</li>
            <li>{report.alreadyInDatabaseCount} already in the system</li>
            <li>
              <strong>{report.readyToImportCount}</strong> ready to import
            </li>
          </ul>
          {report.invalidSample.length > 0 ? (
            <p className="bp-muted" style={{ marginTop: "0.5rem" }}>
              Invalid examples: {report.invalidSample.join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
