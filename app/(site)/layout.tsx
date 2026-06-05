import { Providers } from "@/app/providers";
import { TopBar } from "@/components/layout/TopBar";
import { RulesGate } from "@/components/RulesGate";
import { Toaster } from "@/components/ui/Toaster";
import { listBoards } from "@/lib/db/services/boards";
import { getServerLocale } from "@/lib/i18n/server";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const boards = listBoards();
  const locale = await getServerLocale();
  return (
    <Providers initialLocale={locale}>
      <div className="min-h-screen">
        <TopBar boards={boards} />
        {children}
      </div>
      <RulesGate />
      <Toaster />
    </Providers>
  );
}
