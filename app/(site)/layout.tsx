import { Providers } from "@/app/providers";
import { TopBar } from "@/components/layout/TopBar";
import { RulesGate } from "@/components/RulesGate";
import { Toaster } from "@/components/ui/Toaster";
import { listBoards } from "@/lib/db/services/boards";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const boards = listBoards();
  return (
    <Providers>
      <div className="min-h-screen">
        <TopBar boards={boards} />
        {children}
      </div>
      <RulesGate />
      <Toaster />
    </Providers>
  );
}
