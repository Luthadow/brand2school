import { SchoolInfrastructureClient } from "./ui";

export default function SchoolInfrastructurePage({
  params
}: {
  params: { schoolId: string };
}): JSX.Element {
  return <SchoolInfrastructureClient schoolId={params.schoolId} />;
}
