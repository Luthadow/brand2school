"use client";

import { useCommunityPortal } from "../CommunityPortalContext";

export function CommunityProfilePage(): JSX.Element {
  const { organization, organizationMeta, verification, whatsapp } = useCommunityPortal();

  return (
    <div className="cp-page">
      <header className="cp-page-head">
        <p className="ds-eyebrow">Organisation profile</p>
        <h1>{organization.name}</h1>
        <p className="cp-muted">{organizationMeta.label} · {organization.district}, {organization.province}</p>
      </header>

      <section className="card cp-profile-panel">
        <h2>Contact & identity</h2>
        <dl className="cp-profile-dl">
          <dt>Organisation code</dt>
          <dd>{organization.schoolCode}</dd>
          <dt>Contact name</dt>
          <dd>{organization.principalName}</dd>
          <dt>Email</dt>
          <dd>{organization.contactEmail ?? "—"}</dd>
          <dt>WhatsApp</dt>
          <dd>{organization.whatsappPhone}</dd>
          <dt>Status</dt>
          <dd>{organization.status}</dd>
          <dt>Verification</dt>
          <dd>{verification.status.replace(/_/g, " ")}</dd>
        </dl>
      </section>

      <section className="card cp-profile-panel">
        <h2>Centre types</h2>
        <ul className="cp-profile-list">
          {organizationMeta.centreTypes.map((c) => (
            <li key={c.id}>{c.label}</li>
          ))}
        </ul>
      </section>

      <p className="cp-muted">
        WhatsApp participation line: {whatsapp.phone} · Commands: {whatsapp.commands.join(", ")}
      </p>
    </div>
  );
}
