import type { Metadata } from "next";
import { BrandOverview } from "../../../components/brand-portal/BrandOverview";

export const metadata: Metadata = {
  title: "Brand Overview — Brand2School",
  description: "CSR impact, campaign analytics, and transparent infrastructure tracking for brand partners."
};

export default function BrandDashboardOverviewPage(): JSX.Element {
  return <BrandOverview />;
}
