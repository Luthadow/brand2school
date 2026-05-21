import type { Metadata } from "next";
import Link from "next/link";
import { BrandLoginForm } from "../../../components/brands/BrandLoginForm";

export const metadata: Metadata = {
  title: "Brand Partner Login — Brand2School",
  description: "Secure access to campaign analytics, ESG reporting, and verified participation intelligence."
};

export default function BrandLoginPage(): JSX.Element {
  return (
    <main className="reg-page">
      <div className="reg-container reg-container--narrow">
        <p className="ds-eyebrow">Brand Partners</p>
        <h1>Impact Intelligence Login</h1>
        <p className="reg-hint">
          Access verified participation analytics, province reach, and exportable ESG reports for your campaigns.
        </p>
        <BrandLoginForm />
        <p className="reg-hint" style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <Link href="/movement">View the public movement</Link>
          {" · "}
          <Link href="/">Back to home</Link>
        </p>
      </div>
    </main>
  );
}
