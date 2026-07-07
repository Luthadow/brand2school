import { notFound } from "next/navigation";
import { PublicSchoolProfileView } from "../../../components/schools/PublicSchoolProfileView";
import { fetchPublicSchool, fetchPublicSchoolCommunity } from "../../../lib/platformPublic";

export async function generateMetadata({
  params
}: {
  params: { schoolCode: string };
}): Promise<{ title: string }> {
  const profile = await fetchPublicSchool(params.schoolCode);
  return { title: profile ? `${profile.name} — Brand2School` : "School — Brand2School" };
}

export default async function PublicSchoolPage({
  params
}: {
  params: { schoolCode: string };
}): Promise<JSX.Element> {
  const profile = await fetchPublicSchool(params.schoolCode);
  if (!profile) notFound();
  const community = await fetchPublicSchoolCommunity(params.schoolCode);

  return (
    <div className="lp pp-page">
      <PublicSchoolProfileView profile={profile} community={community} />
    </div>
  );
}
