"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { csrfFetch } from "../../admin-client-utils";
import { useAdminSession } from "../../useAdminSession";

const ORG_CATEGORY_LABEL: Record<string, string> = {
  SCHOOL: "School",
  NGO_NPO: "NGO / NPO",
  COMMUNITY: "Community",
  FAITH: "Faith"
};

const VERIFICATION_STATUS_LABEL: Record<string, string> = {
  NOT_SUBMITTED: "Not submitted",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected"
};

const statusProgression = ["PENDING", "VERIFIED", "APPROVED", "ACTIVE"] as const;
const nextStatus = (status: string): string | null => {
  const idx = statusProgression.indexOf(status as (typeof statusProgression)[number]);
  return idx >= 0 && idx < statusProgression.length - 1 ? statusProgression[idx + 1] : null;
};

type VerificationDoc = {
  key: string;
  label: string;
  uploaded: boolean;
  deferred: boolean;
  url: string | null;
};

type ProfilePayload = {
  school: {
    id: string;
    name: string;
    province: string;
    district: string;
    address: string;
    principalName: string;
    contactEmail: string | null;
    email: string;
    whatsappPhone: string;
    schoolCode: string;
    organizationCategory: string;
    status: string;
    annualCycleYear: number | null;
    annualCycleFocus: string | null;
    createdAt: string;
    updatedAt: string;
  };
  adminUser: { id: string; fullName: string; email: string; status: string } | null;
  verification: {
    status: string;
    centreTypeLabel: string | null;
    emisNumber: string | null;
    registrationNumber: string | null;
    registrationNumberLabel: string | null;
    claimReady: boolean;
    hasActiveDeferrals: boolean;
    submittedAt: string | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
    reviewerNotes: string | null;
    documents: VerificationDoc[];
  } | null;
  participation: {
    learnerCount: number;
    validSubmissions: number;
    flaggedSubmissions: number;
    rejectedSubmissions: number;
  };
  development: {
    currentPhase: number;
    tier: number;
    tierLabel: string;
    nationalScore: number;
    centreTypeLabel: string | null;
    phases: Array<{ phase: number; title: string; status: string; progressPercent: number }>;
    infrastructureTotal: number;
    infrastructureVerified: number;
  };
  needsSummary: {
    complete: number;
    inProgress: number;
    maintenanceRequired: number;
    pending: number;
  };
  funding: {
    balanceZar: number;
    lifetimeGrossZar: number;
    recent: Array<{ id: string; grossZar: number; campaignName: string; createdAt: string }>;
  };
  nationalRank: number | null;
  campaigns: Array<{
    id: string;
    name: string;
    brandName: string;
    validSubmissions: number;
    targetSubmissions: number;
    percentToTarget: number;
  }>;
};

function formatZar(value: number): string {
  return `R ${value.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }): JSX.Element {
  return (
    <div className="school-profile-detail">
      <span className="school-profile-detail__label">{label}</span>
      <span className="school-profile-detail__value">{value}</span>
    </div>
  );
}

export function SchoolProfileClient({ schoolId }: { schoolId: string }): JSX.Element {
  const { session, loading } = useAdminSession();
  const [data, setData] = useState<ProfilePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    const res = await csrfFetch(`/api/admin/schools/${schoolId}`);
    if (!res.ok) {
      setError("Could not load school profile.");
      return;
    }
    setData((await res.json()) as ProfilePayload);
    setError(null);
  }, [schoolId]);

  useEffect(() => {
    void load();
  }, [load]);

  const showToast = (message: string): void => {
    setToast(message);
    setTimeout(() => setToast(null), 2800);
  };

  const advanceStatus = async (): Promise<void> => {
    if (!data) return;
    const next = nextStatus(data.school.status);
    if (!next) return;
    setAdvancing(true);
    const res = await csrfFetch(`/api/admin/approvals/schools/${schoolId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next })
    });
    const json = (await res.json().catch(() => ({}))) as { message?: string };
    setAdvancing(false);
    if (!res.ok) {
      showToast(json.message ?? "Could not update status.");
      return;
    }
    showToast(`Status updated to ${next}.`);
    await load();
  };

  if (loading || !session) return <p>Loading...</p>;
  if (session.user.role !== "SUPER_ADMIN") return <p>School profile requires SUPER_ADMIN.</p>;
  if (error) return <p>{error}</p>;
  if (!data) return <p>Loading school profile…</p>;

  const { school, verification, participation, development, needsSummary, funding } = data;
  const orgLabel = ORG_CATEGORY_LABEL[school.organizationCategory] ?? school.organizationCategory;
  const next = nextStatus(school.status);
  const regValue = verification?.emisNumber ?? verification?.registrationNumber;
  const needsPacketApproval =
    Boolean(next && ["APPROVED", "ACTIVE"].includes(next)) &&
    verification != null &&
    verification.status !== "APPROVED" &&
    verification.status !== "REJECTED";

  return (
    <div className="school-profile">
      <p className="school-profile__back">
        <Link href="/dashboard/verified">← Verified organisations</Link>
      </p>

      <header className="school-profile__header card">
        <div>
          <p style={{ margin: 0, color: "#5a6d8a", fontSize: "0.9rem" }}>{orgLabel}</p>
          <h1 style={{ margin: "0.2rem 0 0" }}>{school.name}</h1>
          <p style={{ margin: "0.35rem 0 0", color: "#475569" }}>
            {school.address} · Code <strong>{school.schoolCode}</strong>
          </p>
        </div>
        <div className="school-profile__actions">
          <span className="school-profile__status">{school.status}</span>
          <Link href={`/dashboard/schools/${schoolId}/verification`} className="btn">
            Verification
          </Link>
          <Link href={`/dashboard/schools/${schoolId}/infrastructure`} className="btn">
            Infrastructure
          </Link>
          {next ? (
            <button type="button" disabled={advancing} onClick={() => void advanceStatus()}>
              {advancing
                ? "Updating…"
                : needsPacketApproval
                  ? `Approve docs & move to ${next}`
                  : `Move to ${next}`}
            </button>
          ) : null}
        </div>
      </header>

      <div className="school-profile__grid">
        <section className="card school-profile__section">
          <h2>Contact &amp; account</h2>
          <DetailRow label="Principal" value={school.principalName} />
          <DetailRow label="Contact email" value={school.contactEmail ?? "—"} />
          <DetailRow label="Portal login" value={school.email} />
          <DetailRow label="WhatsApp" value={school.whatsappPhone} />
          {data.adminUser ? (
            <>
              <DetailRow label="Admin user" value={data.adminUser.fullName} />
              <DetailRow label="Admin email" value={data.adminUser.email} />
              <DetailRow label="User status" value={data.adminUser.status} />
            </>
          ) : (
            <DetailRow label="Admin user" value="—" />
          )}
          <DetailRow label="Registered" value={new Date(school.createdAt).toLocaleString("en-ZA")} />
          <DetailRow label="Last updated" value={new Date(school.updatedAt).toLocaleString("en-ZA")} />
          {school.annualCycleYear ? (
            <DetailRow
              label="Annual cycle"
              value={`${school.annualCycleYear}${school.annualCycleFocus ? ` · ${school.annualCycleFocus}` : ""}`}
            />
          ) : null}
        </section>

        <section className="card school-profile__section">
          <div className="school-profile__section-head">
            <h2>Verification</h2>
            <Link href={`/dashboard/schools/${schoolId}/verification`}>Open</Link>
          </div>
          {verification ? (
            <>
              {needsPacketApproval ? (
                <p className="school-profile__alert">
                  Documents are submitted but the verification packet is not approved yet. Click{" "}
                  <strong>Approve docs &amp; move to {next}</strong> above to review and advance in one step, or open{" "}
                  <Link href={`/dashboard/schools/${schoolId}/verification`}>Verification</Link> to approve manually
                  first.
                </p>
              ) : null}
              <DetailRow
                label="Packet status"
                value={VERIFICATION_STATUS_LABEL[verification.status] ?? verification.status}
              />
              {verification.centreTypeLabel ? (
                <DetailRow label="Centre type" value={verification.centreTypeLabel} />
              ) : null}
              {regValue ? (
                <DetailRow
                  label={verification.registrationNumberLabel ?? "Registration"}
                  value={regValue}
                />
              ) : null}
              {verification.submittedAt ? (
                <DetailRow
                  label="Submitted"
                  value={new Date(verification.submittedAt).toLocaleString("en-ZA")}
                />
              ) : null}
              {verification.reviewedAt ? (
                <DetailRow
                  label="Reviewed"
                  value={new Date(verification.reviewedAt).toLocaleString("en-ZA")}
                />
              ) : null}
              <DetailRow
                label="Claim ready"
                value={verification.claimReady ? "Yes" : "No — outstanding documents"}
              />
              {verification.rejectionReason ? (
                <DetailRow label="Rejection reason" value={verification.rejectionReason} />
              ) : null}
              {verification.reviewerNotes ? (
                <DetailRow label="Reviewer notes" value={verification.reviewerNotes} />
              ) : null}
              <ul className="school-profile__doc-list">
                {verification.documents.map((doc) => (
                  <li key={doc.key}>
                    {doc.label}{" "}
                    {doc.uploaded && doc.url ? (
                      <a href={doc.url} target="_blank" rel="noreferrer">
                        view
                      </a>
                    ) : doc.uploaded ? (
                      "(uploaded)"
                    ) : doc.deferred ? (
                      <span style={{ color: "#b45309" }}>(deferred)</span>
                    ) : (
                      <span style={{ color: "#b91c1c" }}>(missing)</span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p style={{ color: "#64748b" }}>No verification record yet.</p>
          )}
        </section>

        <section className="card school-profile__section">
          <h2>Participation</h2>
          <DetailRow label="Learners" value={participation.learnerCount} />
          <DetailRow label="Valid submissions" value={participation.validSubmissions} />
          <DetailRow label="Flagged for review" value={participation.flaggedSubmissions} />
          <DetailRow label="Rejected submissions" value={participation.rejectedSubmissions} />
          <DetailRow label="National rank" value={data.nationalRank ? `#${data.nationalRank}` : "—"} />
        </section>

        <section className="card school-profile__section">
          <div className="school-profile__section-head">
            <h2>Development &amp; infrastructure</h2>
            <Link href={`/dashboard/schools/${schoolId}/infrastructure`}>Open</Link>
          </div>
          <DetailRow label="Phase" value={development.currentPhase} />
          <DetailRow label="Tier" value={`${development.tierLabel} (tier ${development.tier})`} />
          <DetailRow label="National score" value={`${development.nationalScore}%`} />
          <DetailRow
            label="Infrastructure verified"
            value={`${development.infrastructureVerified} / ${development.infrastructureTotal}`}
          />
          <DetailRow
            label="Needs"
            value={`${needsSummary.complete} complete · ${needsSummary.inProgress} in progress · ${needsSummary.pending} pending`}
          />
          <ul className="school-profile__phase-list">
            {development.phases.map((phase) => (
              <li key={phase.phase}>
                Phase {phase.phase}: {phase.title} — {phase.status} ({phase.progressPercent}%)
              </li>
            ))}
          </ul>
        </section>

        <section className="card school-profile__section">
          <h2>Funding</h2>
          <DetailRow label="Balance" value={formatZar(funding.balanceZar)} />
          <DetailRow label="Lifetime gross" value={formatZar(funding.lifetimeGrossZar)} />
          {funding.recent.length > 0 ? (
            <ul className="school-profile__doc-list">
              {funding.recent.map((entry) => (
                <li key={entry.id}>
                  {formatZar(entry.grossZar)} · {entry.campaignName} ·{" "}
                  {new Date(entry.createdAt).toLocaleDateString("en-ZA")}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#64748b", marginBottom: 0 }}>No funding contributions yet.</p>
          )}
        </section>

        <section className="card school-profile__section school-profile__section--wide">
          <h2>Active campaigns</h2>
          {data.campaigns.length === 0 ? (
            <p style={{ color: "#64748b", marginBottom: 0 }}>No active campaigns.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Brand</th>
                    <th>Progress</th>
                    <th>Valid codes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td>{campaign.name}</td>
                      <td>{campaign.brandName}</td>
                      <td>{campaign.percentToTarget}%</td>
                      <td>
                        {campaign.validSubmissions} / {campaign.targetSubmissions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {toast ? <div className="toast success">{toast}</div> : null}
    </div>
  );
}
