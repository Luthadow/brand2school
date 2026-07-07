import type { Metadata } from "next";
import { BrandRoiPage } from "../../../../components/brand-portal/pages/BrandRoiPage";

export const metadata: Metadata = {
  title: "ROI Dashboard — Brand2School",
  description: "Board-ready ESG ROI — investment vs impact, cost per verified interaction, and provincial efficiency."
};

export default function Page(): JSX.Element {
  return <BrandRoiPage />;
}
