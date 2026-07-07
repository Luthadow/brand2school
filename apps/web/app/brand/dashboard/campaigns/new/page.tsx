import type { Metadata } from "next";
import { CampaignBuilderWizard } from "../../../../../components/brand-portal/CampaignBuilderWizard";

export const metadata: Metadata = {
  title: "Create Campaign — Brand2School",
  description: "Build a participation campaign with impact goals, products, and territorial scope."
};

export default function NewCampaignPage(): JSX.Element {
  return <CampaignBuilderWizard />;
}
