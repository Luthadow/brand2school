import Link from "next/link";
import { Shield, ShieldCheck, FileCheck, Lock } from "lucide-react";
import { fetchPlatformTrust } from "../../lib/platformPublic";
import { formatCount } from "../../lib/formatCount";

export default async function TrustPage(): Promise<JSX.Element> {
  const trust = await fetchPlatformTrust();

  return (
    <div className="lp pp-page">
      <section className="lp-section lp-section-light">
        <div className="lp-container">
          <p className="ds-eyebrow">Verification &amp; transparency</p>
          <h1 className="ds-section-title ds-section-title--left">How Brand2School verifies partners and schools</h1>
          <p className="lp-problem-text">
            Public logos and impact metrics are governance-controlled. We do not display placeholder or unapproved
            brand marks.
          </p>

          {trust ? (
            <div className="pp-trust-metrics" style={{ marginTop: "2rem" }}>
              <div className="pp-trust-metric-card">
                <strong>{formatCount(trust.verifiedSchools)}</strong>
                <span>Verified schools on platform</span>
              </div>
              <div className="pp-trust-metric-card">
                <strong>{formatCount(trust.activeBrandPartners)}</strong>
                <span>Public brand partners</span>
              </div>
              <div className="pp-trust-metric-card">
                <strong>{formatCount(trust.validSubmissions)}</strong>
                <span>Verified participations</span>
              </div>
              <div className="pp-trust-metric-card">
                <strong>{formatCount(trust.openFraudFlags)}</strong>
                <span>Open fraud flags</span>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <h2 className="ds-section-title ds-section-title--left">Partner logo policy</h2>
          <ul className="lp-trust-list">
            <li>
              <ShieldCheck size={18} /> Brand must be <strong>ACTIVE</strong> in the admin system
            </li>
            <li>
              <FileCheck size={18} /> SUPER_ADMIN enables <strong>public profile</strong> or <strong>homepage featured</strong>
            </li>
            <li>
              <Lock size={18} /> Homepage logos require an uploaded, approved PNG asset
            </li>
            <li>
              <Shield size={18} /> Written brand consent required before public trademark display
            </li>
          </ul>
        </div>
      </section>

      {trust ? (
        <section className="lp-section lp-section-light">
          <div className="lp-container">
            <h2 className="ds-section-title ds-section-title--left">Platform protections</h2>
            <ul className="lp-trust-list">
              {trust.protections.map((item) => (
                <li key={item}>
                  <ShieldCheck size={18} /> {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="lp-section">
        <div className="lp-container" style={{ textAlign: "center" }}>
          <Link href="/partners" className="ds-btn ds-btn-primary">
            View verified partners
          </Link>
          <Link href="/impact" className="ds-btn ds-btn-secondary" style={{ marginLeft: "0.75rem" }}>
            National impact dashboard
          </Link>
          <Link href="/movement" className="ds-btn ds-btn-secondary" style={{ marginLeft: "0.75rem" }}>
            Live movement dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
