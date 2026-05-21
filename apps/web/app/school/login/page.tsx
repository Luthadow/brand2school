import type { Metadata } from "next";
import Link from "next/link";
import { SchoolLoginForm } from "../../../components/schools/SchoolLoginForm";

export const metadata: Metadata = {
  title: "Principal Login — Brand2School",
  description: "Sign in to your school principal portal on Brand2School."
};

export default function SchoolLoginPage(): JSX.Element {
  return (
    <main className="reg-page">
      <div className="reg-container">
        <Link href="/" className="reg-back">
          ← Back to home
        </Link>
        <p className="ds-eyebrow">Principal Portal</p>
        <h1 className="reg-title">School Login</h1>
        <p className="reg-intro">Access campaign progress, school rankings, and verified participation from your community.</p>
        <SchoolLoginForm />
      </div>
    </main>
  );
}
