import Link from "next/link";
import { Lock } from "lucide-react";
import { listBoards } from "@/lib/db/services/boards";
import { getServerTranslations } from "@/lib/i18n/server";
import { translateBoard } from "@/lib/i18n/locales";

export const dynamic = "force-dynamic";

export default async function Home() {
  const boards = listBoards();
  const { locale, t } = await getServerTranslations();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-8">
        <h1 className="font-mono text-2xl lowercase tracking-tight text-[var(--color-text)]">
          xhw<span className="text-[var(--color-accent)]"> {t("logo.life")}</span>
        </h1>
        <p className="mt-1 font-mono text-sm text-[var(--color-muted)]">{t("home.boards")}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((b) => (
          <Link
            key={b.id}
            href={`/b/${b.id}`}
            className="block rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[color-mix(in_oklch,var(--color-accent)_50%,var(--color-border))]"
          >
            <div className="flex items-center gap-2">
              <span className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-accent)]">
                /{b.id}/
              </span>
              <span className="font-medium">{translateBoard(locale, b.id, "name", b.name)}</span>
              {b.adminOnlyPost && <Lock size={12} className="text-[var(--color-muted)]" />}
            </div>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{translateBoard(locale, b.id, "description", b.description)}</p>
            <p className="mt-3 font-mono text-xs text-[var(--color-muted)]">
              {t("board.threads_count", { count: b.liveThreads })}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
