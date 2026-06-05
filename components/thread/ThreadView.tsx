"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { qk } from "@/lib/query/keys";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/hooks/useSession";
import { Post } from "./Post";
import { ReplyComposer } from "./ReplyComposer";
import type { ThreadData } from "@/lib/types";
import { useI18n } from "@/lib/i18n/client";

export function ThreadView({ board, threadId }: { board: string; threadId: string }) {
  const { data } = useQuery({
    queryKey: qk.thread(threadId),
    queryFn: () => apiFetch<ThreadData>(`/api/threads/${threadId}`),
  });
  const session = useSession();
  const isAdmin = session?.role === "admin";
  const { t } = useI18n();

  // data is always present on first render due to SSR hydration
  if (!data) return null;

  const { thread, posts } = data;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4">
        <Link
          href={`/b/${board}`}
          className="font-mono text-xs text-[var(--color-muted)] hover:underline"
        >
          ← /{board}/
        </Link>
        {thread.title && <h1 className="mt-1 text-lg font-medium">{thread.title}</h1>}
        <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">
          {t("board.replies_count", { count: thread.replyCount })}
          {thread.isLocked && ` · ${t("board.lock")}`}
          {thread.isPinned && ` · ${t("board.pin")}`}
        </p>
      </div>

      <div className="space-y-2">
        {posts.map((p) => (
          <Post key={p.id} post={p} threadId={threadId} isAdmin={isAdmin} />
        ))}
      </div>

      <div className="mt-6">
        <ReplyComposer threadId={threadId} boardId={thread.boardId} locked={thread.isLocked} />
      </div>
    </main>
  );
}
