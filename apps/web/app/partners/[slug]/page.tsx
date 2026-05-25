import { notFound } from "next/navigation";
import { PublicBrandProfileView } from "../../../components/partners/PublicBrandProfileView";
import { fetchPublicBrand } from "../../../lib/platformPublic";

export default async function PartnerProfilePage({
  params
}: {
  params: { slug: string };
}): Promise<JSX.Element> {
  const profile = await fetchPublicBrand(params.slug);
  if (!profile) notFound();

  return (
    <div className="lp pp-page">
      <PublicBrandProfileView profile={profile} />
    </div>
  );
}
