import { notFound } from "next/navigation";
import Link from "next/link";
import { getThreadWithPosts } from "@/lib/db/services/threads";
import { toPostDTO } from "@/lib/db/dto";
import { getPosterToken } from "@/lib/auth/tokens";
import { Post } from "@/components/thread/Post";
import { ReplyComposer } from "@/components/thread/ReplyComposer";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ board: string; thread: string }>;
}) {
  const { board, thread: threadId } = await params;
  const res = getThreadWithPosts(threadId);
  if (!res) notFound();

  const token = await getPosterToken();
  const posts = res.posts.map((p) => toPostDTO(p, token));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4">
        <Link
          href={`/b/${board}`}
          className="font-mono text-xs text-[var(--color-muted)] hover:underline"
        >
          ← /{board}/
        </Link>
        {res.thread.title && <h1 className="mt-1 text-lg font-medium">{res.thread.title}</h1>}
        <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">
          {res.thread.replyCount} {res.thread.replyCount === 1 ? "reply" : "replies"}
          {res.thread.isLocked && " · 🔒 locked"}
          {res.thread.isPinned && " · 📌 pinned"}
        </p>
      </div>

      <div className="space-y-2">
        {posts.map((p) => (
          <Post key={p.id} post={p} />
        ))}
      </div>

      <div className="mt-6">
        <ReplyComposer threadId={threadId} locked={res.thread.isLocked} />
      </div>
    </main>
  );
}
