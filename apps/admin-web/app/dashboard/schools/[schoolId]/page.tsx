import { SchoolProfileClient } from "./SchoolProfileClient";

export default function SchoolProfilePage({
  params
}: {
  params: { schoolId: string };
}): JSX.Element {
  return <SchoolProfileClient schoolId={params.schoolId} />;
}
