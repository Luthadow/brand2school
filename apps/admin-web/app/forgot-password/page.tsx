import Link from "next/link";
import { AdminForgotPasswordForm } from "./AdminForgotPasswordForm";

export default function AdminForgotPasswordPage(): JSX.Element {
  return (
    <main style={{ maxWidth: "480px", margin: "3rem auto", padding: "0 1rem" }}>
      <Link href="/login">← Admin login</Link>
      <h1 style={{ marginTop: "1rem" }}>Forgot password</h1>
      <p style={{ color: "#6b7280" }}>
        Enter your admin account email. We send a secure reset link only — passwords cannot be retrieved.
      </p>
      <AdminForgotPasswordForm />
    </main>
  );
}
