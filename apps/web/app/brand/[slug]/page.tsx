import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicBrandProfileView } from "../../../components/partners/PublicBrandProfileView";
import { fetchPublicBrand } from "../../../lib/platformPublic";

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const profile = await fetchPublicBrand(params.slug);
  if (!profile) {
    return { title: "Brand | Brand2School" };
  }
  return {
    title: `${profile.name} — Verified Brand | Brand2School`,
    description:
      profile.description ??
      `${profile.name} on Brand2School — verified school infrastructure participation.`
  };
}

/** Canonical public brand profile (verification QR, certificate, impact). */
export default async function PublicBrandProfilePage({
  params
}: {
  params: { slug: string };
}): Promise<JSX.Element> {
  const profile = await fetchPublicBrand(params.slug);
  if (!profile) notFound();

  return (
    <div className="lp pp-page b2s-brand-public-page">
      <PublicBrandProfileView profile={profile} showTrustPanel />
    </div>
  );
}
