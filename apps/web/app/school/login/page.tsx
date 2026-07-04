import { redirect } from "next/navigation";

export default function LegacySchoolLoginPage(): never {
  redirect("/organisations/login?category=school");
}
