import { redirect } from "next/navigation";

export default function ReceptionsPage() {
  redirect("/projects?tab=reception");
}
