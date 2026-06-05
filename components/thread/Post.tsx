import type { PostDTO } from "@/lib/types";
import { cn } from "@/lib/cn";
import { RelTime } from "@/components/RelTime";
import { PostBody } from "./PostBody";
import { DeleteButton } from "./DeleteButton";

export function Post({ post, threadId }: { post: PostDTO; threadId: string }) {
  return (
    <article
      id={`p-${post.id}`}
      className={cn(
        "scroll-mt-20 rounded-[var(--radius)] border border-[var(--color-border)] p-3 transition-opacity",
        post.isOp ? "bg-[var(--color-surface-2)]" : "bg-[var(--color-surface)]",
        post.pending && "opacity-60",
      )}
    >
      <div className="mb-1.5 flex items-center gap-2 font-mono text-xs text-[var(--color-muted)]">
        <span className={post.name === "Anonymous" ? "" : "text-[var(--color-text)]"}>
          {post.name}
        </span>
        {post.tripcode && <span className="text-[var(--color-accent)]">{post.tripcode}</span>}
        <span className="text-[var(--color-border)]">·</span>
        <span className="select-all">
          {post.pending ? "…" : `#${post.id}`}
        </span>
        <span className="text-[var(--color-border)]">·</span>
        <RelTime ts={post.createdAt} />
        {post.pending && (
          <span className="font-mono text-xs text-[var(--color-muted)]">posting…</span>
        )}
        {post.canDeleteUntil != null && !post.pending && (
          <span className="ml-auto">
            <DeleteButton postId={post.id} threadId={threadId} />
          </span>
        )}
      </div>

      {post.deleted ? (
        <p className="text-sm italic text-[var(--color-muted)]">[deleted]</p>
      ) : (
        <PostBody body={post.body} />
      )}
    </article>
  );
}
