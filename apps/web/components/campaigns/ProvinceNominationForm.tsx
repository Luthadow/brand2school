"use client";

import { useEffect, useState } from "react";

type ProvinceOption = { code: string; name: string };

export function ProvinceNominationForm({
  defaultProvinceCode,
  campaignSlug,
  compact = false
}: {
  defaultProvinceCode?: string;
  campaignSlug?: string;
  compact?: boolean;
}): JSX.Element {
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [provinceCode, setProvinceCode] = useState(defaultProvinceCode ?? "");
  const [schoolName, setSchoolName] = useState("");
  const [district, setDistrict] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    void fetch("/api/platform/province-options", { cache: "force-cache" })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => setProvinces(rows as ProvinceOption[]))
      .catch(() => setProvinces([]));
  }, []);

  useEffect(() => {
    if (defaultProvinceCode) setProvinceCode(defaultProvinceCode);
  }, [defaultProvinceCode]);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/platform/province-nominations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provinceCode,
          schoolName: schoolName.trim() || undefined,
          district: district.trim() || undefined,
          contactName: contactName.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          campaignSlug: campaignSlug?.trim() || undefined,
          message: message.trim() || undefined,
          source: "web"
        })
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setFeedback({ kind: "err", text: data.message ?? "Could not submit nomination." });
        return;
      }
      setFeedback({ kind: "ok", text: data.message ?? "Nomination received. Thank you." });
      setMessage("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={`b2s-nominate${compact ? " b2s-nominate--compact" : ""}`} onSubmit={(e) => void submit(e)}>
      <p className="b2s-nominate-lead">
        No campaign in your province yet? Nominate your region so brands can allocate provincial packages here.
      </p>
      <div className="b2s-nominate-grid">
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
        <label>
          School name
          <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="Optional" />
        </label>
        <label>
          District
          <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Optional" />
        </label>
        <label>
          Contact name
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Principal / SGB" />
        </label>
        <label>
          Email
          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Optional" />
        </label>
        <label>
          WhatsApp / phone
          <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Optional" />
        </label>
      </div>
      <label className="b2s-nominate-full">
        Why should brands invest here?
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="e.g. rural water and sanitation needs, 800 learners, strong community participation"
        />
      </label>
      <button type="submit" className="ds-btn ds-btn-primary" disabled={loading || !provinceCode}>
        {loading ? "Submitting…" : "Nominate my province"}
      </button>
      {feedback ? <p className={`b2s-nominate-feedback b2s-nominate-feedback--${feedback.kind}`}>{feedback.text}</p> : null}
    </form>
  );
}
