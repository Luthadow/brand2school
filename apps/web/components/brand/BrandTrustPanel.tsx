import Link from "next/link";
import type { Route } from "next";
import { Award, Download, QrCode } from "lucide-react";
import { BrandQrImage } from "./BrandQrImage";
import { apiAssetUrl } from "../../lib/apiAssetUrl";

type TrustProps = {
  brandName: string;
  slug: string;
  verificationCode: string | null;
  verificationStatus: string | null;
  founderVerified: boolean;
  isTrusted: boolean;
  verifyUrl: string | null;
  certificatePdfUrl: string | null;
  verifyQrImageUrl: string | null;
  brandQrImageUrl: string | null;
  accent?: string;
};

function statusLabel(status: string | null, founder: boolean): string {
  if (status === "FOUNDER_VERIFIED" || founder) return "Founding verified partner";
  if (status === "VERIFIED") return "Verified brand partner";
  if (status === "PENDING") return "Pending verification";
  return "Registered partner";
}

export function BrandTrustPanel({
  brandName,
  slug,
  verificationCode,
  verificationStatus,
  founderVerified,
  isTrusted,
  verifyUrl,
  certificatePdfUrl,
  verifyQrImageUrl,
  brandQrImageUrl,
  accent = "#003b8e"
}: TrustProps): JSX.Element {
  return (
    <aside className="b2s-brand-trust-panel card" style={{ borderTop: `4px solid ${accent}` }}>
      <div className="b2s-brand-trust-panel-head">
        <Award size={22} aria-hidden style={{ color: accent }} />
        <div>
          <h2 className="ds-card-title">Brand verification</h2>
          <p className="b2s-brand-trust-status">{statusLabel(verificationStatus, founderVerified)}</p>
        </div>
      </div>

      {verificationCode ? (
        <p className="b2s-brand-trust-code">
          Code: <code>{verificationCode}</code>
        </p>
      ) : null}

      {isTrusted && verifyQrImageUrl ? (
        <div className="b2s-brand-trust-qr-block">
          <p className="b2s-brand-trust-qr-label">
            <QrCode size={16} aria-hidden /> Scan to verify
          </p>
          <BrandQrImage apiPath={verifyQrImageUrl} alt={`Verify ${brandName} on Brand2School`} size={168} />
          {verifyUrl ? (
            <Link href={verifyUrl as Route} className="b2s-brand-trust-verify-link">
              brand2school.co.za{verifyUrl}
            </Link>
          ) : null}
        </div>
      ) : null}

      {brandQrImageUrl ? (
        <div className="b2s-brand-trust-qr-block b2s-brand-trust-qr-block--secondary">
          <p className="b2s-brand-trust-qr-label">Share this brand profile</p>
          <BrandQrImage apiPath={brandQrImageUrl} alt={`${brandName} brand profile QR`} size={120} />
        </div>
      ) : null}

      <div className="b2s-brand-trust-actions">
        {isTrusted && certificatePdfUrl ? (
          <a
            href={apiAssetUrl(certificatePdfUrl)}
            className="ds-btn ds-btn-primary"
            download
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download size={16} aria-hidden /> Download certificate (PDF)
          </a>
        ) : null}
        {verifyUrl ? (
          <Link href={verifyUrl as Route} className="ds-btn ds-btn-secondary">
            Open verification page
          </Link>
        ) : null}
        <Link href={`/partners/${slug}` as Route} className="ds-btn ds-btn-secondary">
          Partner directory view
        </Link>
      </div>
    </aside>
  );
}
