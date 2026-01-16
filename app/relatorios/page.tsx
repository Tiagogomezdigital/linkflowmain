import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth-server";
import ClientRelatorios from "@/components/reports/ClientRelatorios";

export default async function RelatoriosPage() {
  const session = await getUserSession();
  if (!session) return redirect("/login");
  return <ClientRelatorios />;
}
