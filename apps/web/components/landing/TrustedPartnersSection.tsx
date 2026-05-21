import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import type { PlatformPartner } from "../../lib/platformPartners";

export function TrustedPartnersSection({ partners }: { partners: PlatformPartner[] }): JSX.Element | null {
  if (partners.length === 0) return null;

  return (
    <section className="lp-trust" aria-label="Verified education partners">
      <div className="lp-container">
        <p className="lp-trust-label">Verified partners supporting education impact</p>
        <ul className="lp-trust-logos">
          {partners.map((partner) => (
            <li key={partner.slug}>
              <Link href={`/partners/${partner.slug}` as Route} className="lp-trust-logo-link" title={partner.name}>
                <Image
                  src={partner.logoUrl}
                  alt={`${partner.name} logo`}
                  width={140}
                  height={60}
                  className="lp-trust-logo-img"
                />
              </Link>
            </li>
          ))}
        </ul>
        <p className="lp-trust-legal-note">
          Logos shown with brand approval for active verified partnerships.{" "}
          <Link href="/partners">View all partners</Link> · <Link href="/trust">Verification policy</Link>
        </p>
      </div>
    </section>
  );
}

export function PartnerCtaStrip(): JSX.Element {
  return (
    <section className="lp-supported" aria-label="Partner with Brand2School">
      <div className="lp-container">
        <p className="lp-supported-label">Brands and retailers: launch verified campaigns on Brand2School</p>
        <p className="lp-supported-note">
          Register your organisation, run infrastructure campaigns, and track every verified participation — from first
          code to delivery.
        </p>
        <div
          style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}
        >
          <Link href="/for-brands" className="ds-btn ds-btn-primary">
            Partner as a brand
          </Link>
          <Link href="/schools/register" className="ds-btn ds-btn-secondary">
            Register a school
          </Link>
        </div>
      </div>
    </section>
  );
}
