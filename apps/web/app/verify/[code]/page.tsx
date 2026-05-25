import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Download, ShieldAlert, ShieldCheck } from "lucide-react";
import { BrandQrImage } from "../../../components/brand/BrandQrImage";
import { fetchBrandVerification } from "../../../lib/brandVerification";
import { apiAssetUrl } from "../../../lib/apiAssetUrl";

export async function generateMetadata({
  params
}: {
  params: { code: string };
}): Promise<Metadata> {
  const profile = await fetchBrandVerification(params.code);
  return {
    title: profile
      ? `${profile.brandName} — Brand Verification | Brand2School`
      : "Brand Verification | Brand2School",
    description: profile
      ? `Verify ${profile.brandName} on Brand2School. Code ${profile.verificationCode}.`
      : "Verify a Brand2School partner brand."
  };
}

function statusLabel(status: string, founder: boolean): string {
  if (status === "FOUNDER_VERIFIED" || founder) return "Founding verified partner";
  if (status === "VERIFIED") return "Verified brand partner";
  if (status === "PENDING") return "Pending verification";
  if (status === "REJECTED") return "Not approved";
  if (status === "SUSPENDED") return "Suspended";
  return status;
}

export default async function VerifyBrandPage({
  params
}: {
  params: { code: string };
}): Promise<JSX.Element> {
  const profile = await fetchBrandVerification(params.code);
  if (!profile) notFound();

  const trusted = profile.isTrusted;
  const accent = profile.brandColor ?? "#003b8e";

  return (
    <div className="lp">
      <section
        className="lp-section lp-section-light"
        style={{ borderBottom: `4px solid ${accent}` }}
      >
        <div className="lp-container b2s-verify-layout">
          <div className="b2s-verify-main" style={{ maxWidth: "40rem" }}>
            <p className="ds-eyebrow">Brand verification</p>
            <div className="b2s-verify-badge" data-trusted={trusted ? "yes" : "no"}>
              {trusted ? (
                <ShieldCheck size={40} aria-hidden style={{ color: accent }} />
              ) : (
                <ShieldAlert size={40} aria-hidden />
              )}
              <div>
                <h1 className="ds-section-title ds-section-title--left">{profile.brandName}</h1>
                <p className="b2s-verify-status">{statusLabel(profile.verificationStatus, profile.founderVerified)}</p>
              </div>
            </div>

            <div className="b2s-verify-card card">
              <dl className="b2s-verify-dl">
                <div>
                  <dt>Verification code</dt>
                  <dd>
                    <code>{profile.verificationCode}</code>
                  </dd>
                </div>
                {profile.verifiedAt ? (
                  <div>
                    <dt>Verified on</dt>
                    <dd>{new Date(profile.verifiedAt).toLocaleDateString("en-ZA", { dateStyle: "long" })}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Platform status</dt>
                  <dd>{profile.entityStatus}</dd>
                </div>
              </dl>

              {profile.logoUrl ? (
                <Image
                  src={profile.logoUrl}
                  alt={`${profile.brandName} logo`}
                  width={160}
                  height={64}
                  className="lp-trust-logo-img"
                  style={{ marginTop: "1rem" }}
                />
              ) : null}

              {profile.description ? (
                <p className="lp-problem-text" style={{ marginTop: "1rem" }}>
                  {profile.description}
                </p>
              ) : null}

              {trusted ? (
                <p className="b2s-verify-trusted">
                  <CheckCircle2 size={18} aria-hidden /> This brand is registered and verified on Brand2School for
                  measurable school infrastructure participation.
                </p>
              ) : (
                <p className="b2s-verify-warn">
                  This code is registered but the brand is not yet fully verified. Contact{" "}
                  <a href="mailto:brands@brand2school.co.za">brands@brand2school.co.za</a> for confirmation.
                </p>
              )}

              <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href={profile.brandProfileUrl as Route} className="ds-btn ds-btn-primary">
                  View brand profile
                </Link>
                {trusted && profile.certificatePdfUrl ? (
                  <a
                    href={apiAssetUrl(profile.certificatePdfUrl)}
                    className="ds-btn ds-btn-secondary"
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download size={16} aria-hidden /> Certificate (PDF)
                  </a>
                ) : null}
                <Link href="/trust" className="ds-btn ds-btn-secondary">
                  Verification policy
                </Link>
              </div>
            </div>
          </div>

          <aside className="b2s-verify-qr-aside card">
            <h2 className="ds-card-title">Scan to verify</h2>
            <BrandQrImage
              apiPath={profile.verifyQrImageUrl}
              alt={`Verify ${profile.brandName}`}
              size={200}
            />
            <p className="b2s-verify-qr-caption">brand2school.co.za{profile.verifyUrl}</p>
            {profile.brandQrImageUrl ? (
              <>
                <h3 className="ds-card-title" style={{ marginTop: "1.25rem", fontSize: "1rem" }}>
                  Brand profile
                </h3>
                <BrandQrImage
                  apiPath={profile.brandQrImageUrl}
                  alt={`${profile.brandName} profile`}
                  size={140}
                />
              </>
            ) : null}
          </aside>
        </div>
      </section>
    </div>
  );
}
