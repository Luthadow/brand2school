import type { Metadata } from "next";
import { BrandCodeInventoryPage } from "../../../../components/brand-portal/pages/BrandCodeInventoryPage";

export const metadata: Metadata = {
  title: "Code Inventory — Brand2School",
  description: "Batch-level code inventory, redemption rates, duplicates, and fraud protection for brand campaigns."
};

export default function Page(): JSX.Element {
  return <BrandCodeInventoryPage />;
}
