"use client";

import { useState } from "react";
import { ImageIcon, Shield, Users } from "lucide-react";
import { useBrandPortal } from "../BrandPortalContext";
import { BrandPageHeader } from "../BrandPageHeader";
import { BrandLogoUpload } from "../BrandLogoUpload";

export function BrandSettingsPage(): JSX.Element {
  const portal = useBrandPortal();
  const [logoUrl, setLogoUrl] = useState(portal.brand.logoUrl);

  return (
    <div className="bp-page">
      <BrandPageHeader
        eyebrow="Admin & Security"
        title="Settings"
        description="Brand profile, logo, user roles, and security for enterprise partners."
      />
      <article className="bp-panel" style={{ marginBottom: "1rem" }}>
        <h2>
          <ImageIcon size={20} /> Brand logo
        </h2>
        <BrandLogoUpload
          brandId={portal.brand.id}
          logoUrl={logoUrl}
          brandName={portal.brand.name}
          onUpdated={setLogoUrl}
        />
      </article>
      <div className="bp-two-col">
        <article className="bp-panel">
          <h2>
            <Users size={20} /> Organisation
          </h2>
          <p>
            <strong>{portal.brand.name}</strong>
          </p>
          <p className="bp-muted">Brand partner · role-based access · session security enabled</p>
        </article>
        <article className="bp-panel">
          <h2>
            <Shield size={20} /> Trust layer
          </h2>
          <ul>
            {portal.analytics.trust.protections.map((p) => (
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
