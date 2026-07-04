import { redirect } from "next/navigation";

export default function LegacySchoolRegisterPage(): never {
  redirect("/organisations/register?category=school");
}
