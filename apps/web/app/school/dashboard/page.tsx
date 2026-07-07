import type { Metadata } from "next";
import { SchoolOverview } from "../../../components/school-portal/SchoolOverview";

export const metadata: Metadata = {
  title: "School Success Centre — Brand2School",
  description: "Verification score, campaign progress, participation analytics, and impact timeline for your school."
};

export default function SchoolDashboardHomePage(): JSX.Element {
  return <SchoolOverview />;
}
