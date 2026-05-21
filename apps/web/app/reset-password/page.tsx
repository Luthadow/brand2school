import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "../../components/auth/ResetPasswordForm";

export const metadata = {
  title: "Reset password — Brand2School",
  description: "Choose a new Brand2School password."
};

export default function ResetPasswordPage(): JSX.Element {
  return (
    <main className="reg-page">
      <div className="reg-container reg-container--narrow">
        <Link href="/" className="reg-back">
          ← Back to home
        </Link>
        <p className="ds-eyebrow">Account</p>
        <h1 className="reg-title">Reset password</h1>
        <p className="reg-intro">Choose a new password for your account.</p>
        <Suspense fallback={<p className="reg-hint">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
