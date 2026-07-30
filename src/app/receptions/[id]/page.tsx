import { redirect } from "next/navigation";

export default function ReceptionDetailPage() {
  redirect("/projects?tab=reception");
}
