import { apiAssetUrl } from "../../lib/apiAssetUrl";

type Props = {
  apiPath: string;
  alt: string;
  size?: number;
  className?: string;
};

/** QR code image served by the API (PNG). */
export function BrandQrImage({ apiPath, alt, size = 160, className }: Props): JSX.Element {
  const src = apiAssetUrl(apiPath);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- dynamic API-generated QR
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className ?? "b2s-brand-qr-img"}
      loading="lazy"
    />
  );
}
