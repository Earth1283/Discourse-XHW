import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/Toaster";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/admin/login");

  return (
    <Providers>
      <AdminDashboard handle={session.handle} />
      <Toaster />
    </Providers>
  );
}
