import Link from "next/link";
import { ForgotPasswordForm } from "../../components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Forgot password — Brand2School",
  description: "Reset your Brand2School account password."
};

export default function ForgotPasswordPage(): JSX.Element {
  return (
    <main className="reg-page">
      <div className="reg-container reg-container--narrow">
        <Link href="/" className="reg-back">
          ← Back to home
        </Link>
        <p className="ds-eyebrow">Account</p>
        <h1 className="reg-title">Forgot password</h1>
        <p className="reg-intro">
          Enter your email to receive a secure reset link. For security, passwords cannot be retrieved — only reset.
        </p>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
