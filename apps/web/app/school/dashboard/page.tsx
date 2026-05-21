import type { Metadata } from "next";
import { SchoolOverview } from "../../../components/school-portal/SchoolOverview";

export const metadata: Metadata = {
  title: "School Dashboard — Brand2School",
  description: "Track needs, campaign progress, and community participation for your school."
};

export default function SchoolDashboardHomePage(): JSX.Element {
  return <SchoolOverview />;
}
