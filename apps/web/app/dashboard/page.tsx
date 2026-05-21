import { redirect } from "next/navigation";

export default function LegacyDashboardRedirect(): never {
  redirect("/brand/dashboard");
}
