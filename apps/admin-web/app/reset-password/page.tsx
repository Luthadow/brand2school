import Link from "next/link";
import { Suspense } from "react";
import { AdminResetPasswordForm } from "./AdminResetPasswordForm";

export default function AdminResetPasswordPage(): JSX.Element {
  return (
    <main style={{ maxWidth: "480px", margin: "3rem auto", padding: "0 1rem" }}>
      <Link href="/login">← Admin login</Link>
      <h1 style={{ marginTop: "1rem" }}>Reset password</h1>
      <p style={{ color: "#6b7280" }}>Choose a new password for your admin account.</p>
      <Suspense fallback={<p>Loading…</p>}>
        <AdminResetPasswordForm />
      </Suspense>
    </main>
  );
}
