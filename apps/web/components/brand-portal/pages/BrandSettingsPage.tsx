"use client";

import { Shield, Users } from "lucide-react";
import { useBrandPortal } from "../BrandPortalContext";
import { BrandPageHeader } from "../BrandPageHeader";

export function BrandSettingsPage(): JSX.Element {
  const { brand, analytics } = useBrandPortal();

  return (
    <div className="bp-page">
      <BrandPageHeader
        eyebrow="Admin & Security"
        title="Settings"
        description="User roles, fraud detection, code validation, and audit logging for enterprise partners."
      />
      <div className="bp-two-col">
        <article className="bp-panel">
          <h2>
            <Users size={20} /> Organisation
          </h2>
          <p>
            <strong>{brand.name}</strong>
          </p>
          <p className="bp-muted">Brand partner · role-based access · session security enabled</p>
        </article>
        <article className="bp-panel">
          <h2>
            <Shield size={20} /> Trust layer
          </h2>
          <ul>
            {analytics.trust.protections.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </article>
      </div>
      <article className="bp-panel">
        <h2>Security features</h2>
        <p className="bp-muted">
          Fraud detection · submission monitoring · immutable audit logs · secure authentication · code
          validation pipeline
        </p>
      </article>
    </div>
  );
}
