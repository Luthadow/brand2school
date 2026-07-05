import type { Metadata } from "next";
import Link from "next/link";
import { PublicLookupSearch } from "../../components/lookup/PublicLookupSearch";

export const metadata: Metadata = {
  title: "Find a School or Brand — Brand2School",
  description:
    "Search registered schools, NGOs, and brand partners on Brand2School to see if your organisation is already on the platform."
};

export default function LookupPage(): JSX.Element {
  return (
    <div className="lp">
      <section className="lp-section lp-section-light">
        <div className="lp-container lookup-page">
          <p className="ds-eyebrow">Registry lookup</p>
          <h1 className="ds-section-title ds-section-title--left">Find a school or brand</h1>
          <p className="lp-problem-text">
            Check whether your school or organisation is already registered, or browse participating brand partners
            running campaigns on Brand2School.
          </p>
          <PublicLookupSearch />
          <p className="lookup-page__foot">
            Not listed?{" "}
            <Link href="/organisations/register">Register your organisation</Link>
            {" · "}
            <Link href="/submit">Submit a product code</Link>
            {" · "}
            <Link href="/partners">Browse all partners</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
