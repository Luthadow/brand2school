import type { Metadata } from "next";
import { BrandOverview } from "../../../components/brand-portal/BrandOverview";

export const metadata: Metadata = {
  title: "Command Centre — Brand2School",
  description: "Campaign-scoped KPIs, code inventory, fraud protection, and geographic reach for brand marketing teams."
};

export default function BrandDashboardOverviewPage(): JSX.Element {
  return <BrandOverview />;
}
