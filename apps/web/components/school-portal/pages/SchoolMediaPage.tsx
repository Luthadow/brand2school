"use client";

import { useSchoolPortal } from "../SchoolPortalContext";

export function SchoolMediaPage(): JSX.Element {
  const portal = useSchoolPortal();

  return (
    <div className="sp-page">
      <header className="sp-page-head">
        <p className="ds-eyebrow">Evidence uploads</p>
        <h1>Photos and updates</h1>
        <p className="sp-muted">Progress photos, handover ceremonies, and thank-you messages.</p>
      </header>
      <div className="sp-upload-zone">
        <p>Tap to upload photo or video</p>
        <p className="sp-muted">Optimized for mobile · weak connections</p>
        <button type="button" className="ds-btn ds-btn-primary">
          Choose file
        </button>
      </div>
      <p className="sp-muted">Or send via WhatsApp to +{portal.whatsapp.phone}</p>
    </div>
  );
}
