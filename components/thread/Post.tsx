"use client";

import type { PostDTO } from "@/lib/types";
import { cn } from "@/lib/cn";
import { RelTime } from "@/components/RelTime";
import { PostBody } from "./PostBody";
import { DeleteButton } from "./DeleteButton";
import { ReportButton } from "./ReportButton";

export function Post({
  post,
  threadId,
  isAdmin = false,
}: {
  post: PostDTO;
  threadId: string;
  isAdmin?: boolean;
}) {
  return (
    <article
      id={`p-${post.id}`}
      className={cn(
        "scroll-mt-20 rounded-[var(--radius)] border border-[var(--color-border)] p-3 transition-opacity",
        post.isOp ? "bg-[var(--color-surface-2)]" : "bg-[var(--color-surface)]",
        post.pending && "opacity-60",
      )}
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-2 font-mono text-xs text-[var(--color-muted)]">
        <span className={post.name === "Anonymous" ? "" : "text-[var(--color-text)]"}>
          {post.name}
        </span>
        {post.tripcode && <span className="text-[var(--color-accent)]">{post.tripcode}</span>}
        <span className="text-[var(--color-border)]">·</span>
        <span className="select-all">{post.pending ? "…" : `#${post.id}`}</span>
        <span className="text-[var(--color-border)]">·</span>
        <RelTime ts={post.createdAt} />
        {post.pending && (
          <span className="font-mono text-xs text-[var(--color-muted)]">posting…</span>
        )}

        {!post.pending && (
          <span className="ml-auto flex items-center gap-2">
            {/* Self-delete: own post within window */}
            {post.canDeleteUntil != null && (
              <DeleteButton postId={post.id} threadId={threadId} />
            )}
            {/* Admin controls: delete any post + ban poster */}
            {isAdmin && !post.deleted && (
              <>
                {post.canDeleteUntil == null && (
                  <DeleteButton postId={post.id} threadId={threadId} />
                )}
                <AdminBanButton postId={post.id} />
              </>
            )}
            {/* Report: non-own, non-deleted, non-pending */}
            {!post.ownPost && !post.deleted && !isAdmin && (
              <ReportButton postId={post.id} />
            )}
          </span>
        )}
      </div>

      {post.deleted ? (
        <p className="text-sm italic text-[var(--color-muted)]">[deleted]</p>
      ) : (
        <>
          {post.imagePath && (
            <div className="mb-2">
              <a href={post.imagePath} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.thumbPath ?? post.imagePath}
                  alt=""
                  className="max-h-64 max-w-full cursor-zoom-in rounded-[calc(var(--radius)-2px)] object-contain"
                  loading="lazy"
                />
              </a>
            </div>
          )}
          <PostBody body={post.body} />
        </>
      )}
    </article>
  );
}

function AdminBanButton({ postId }: { postId: string }) {
  async function ban() {
    if (!confirm("Ban this poster? This is permanent unless lifted.")) return;
    const reason = prompt("Ban reason (optional):") ?? undefined;
    try {
      const res = await fetch(`/api/admin/posts/${postId}/ban`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.error?.message ?? "Ban failed.");
      } else {
        alert("Poster banned.");
      }
    } catch {
      alert("Ban failed.");
    }
  }

  return (
    <button
      onClick={ban}
      title="Ban poster"
      className="font-mono text-[10px] text-[var(--color-muted)] hover:text-[var(--color-danger)]"
    >
      ban
    </button>
  );
}
