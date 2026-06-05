import { notFound } from "next/navigation";
import Link from "next/link";
import { getBoard } from "@/lib/db/services/boards";
import { listThreadCards } from "@/lib/db/services/threads";
import { ThreadCard } from "@/components/board/ThreadCard";
import { CatalogLoadMore } from "@/components/board/CatalogLoadMore";
import { ThreadComposer } from "@/components/thread/ThreadComposer";
import { getSession } from "@/lib/auth/session";
import { getServerTranslations } from "@/lib/i18n/server";
import { translateBoard } from "@/lib/i18n/locales";
import { ClassicalText } from "@/components/lzh/ClassicalText";

export const dynamic = "force-dynamic";

export default async function BoardPage({ params }: { params: Promise<{ board: string }> }) {
  const { board } = await params;
  const brd = getBoard(board);
  if (!brd) notFound();

  const cards = listThreadCards(board, 0);
  const session = await getSession();
  const canPost = !brd.adminOnlyPost || session?.role === "admin";
  const { locale, t } = await getServerTranslations();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="font-mono text-xs text-[var(--color-muted)] hover:underline">
          {t("nav.boards")}
        </Link>
        <h1 className="mt-1 flex items-center gap-2">
          <span className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-sm text-[var(--color-accent)]">
            /{brd.id}/
          </span>
          <span className="text-lg font-medium">{translateBoard(locale, brd.id, "name", brd.name)}</span>
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          <ClassicalText text={translateBoard(locale, brd.id, "description", brd.description)} />
        </p>
      </div>

      {canPost ? (
        <ThreadComposer board={board} />
      ) : (
        <p className="mb-6 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-muted)]">
          {t("board.readonly")}
        </p>
      )}

      {cards.length === 0 ? (
        <p className="py-16 text-center font-mono text-sm text-[var(--color-muted)]">
          {t("board.no_threads")}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <ThreadCard key={c.id} card={c} />
          ))}
          <CatalogLoadMore board={board} initialCount={cards.length} />
        </div>
      )}
    </main>
  );
}
