import type { Metadata } from "next";
import Link from "next/link";
import { SchoolRegisterForm } from "../../../components/schools/SchoolRegisterForm";

export const metadata: Metadata = {
  title: "Register Your School — Brand2School",
  description: "Register your school on Brand2School. Link WhatsApp and track verified community participation toward infrastructure milestones."
};

export default function SchoolRegisterPage(): JSX.Element {
  return (
    <main className="reg-page">
      <div className="reg-container">
        <Link href="/" className="reg-back">
          ← Back to home
        </Link>
        <p className="ds-eyebrow">For Schools</p>
        <h1 className="reg-title">Register Your School</h1>
        <p className="reg-intro">
          Join the national participation network. After registration, your WhatsApp number is linked to your school —
          track campaign progress, rankings, and verified community submissions. No learner registration required.
        </p>
        <SchoolRegisterForm />
      </div>
    </main>
  );
}
