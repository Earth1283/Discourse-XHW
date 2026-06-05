import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/Toaster";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getServerLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/admin/login");

  const locale = await getServerLocale();

  return (
    <Providers initialLocale={locale}>
      <AdminDashboard handle={session.handle} />
      <Toaster />
    </Providers>
  );
}
