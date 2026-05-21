import { SchoolVerificationClient } from "./SchoolVerificationClient";

export default function SchoolVerificationPage({
  params
}: {
  params: { schoolId: string };
}): JSX.Element {
  return <SchoolVerificationClient schoolId={params.schoolId} />;
}
