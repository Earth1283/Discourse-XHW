"use client";

import type { PostDTO } from "@/lib/types";
import { cn } from "@/lib/cn";
import { RelTime } from "@/components/RelTime";
import { PostBody } from "./PostBody";
import { DeleteButton } from "./DeleteButton";
import { ReportButton } from "./ReportButton";
import { useI18n } from "@/lib/i18n/client";

export function Post({
  post,
  threadId,
  isAdmin = false,
}: {
  post: PostDTO;
  threadId: string;
  isAdmin?: boolean;
}) {
  const { t } = useI18n();

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
          {post.name === "Anonymous" ? t("post.anonymous") : post.name}
        </span>
        {post.tripcode && <span className="text-[var(--color-accent)]">{post.tripcode}</span>}
        <span className="text-[var(--color-border)]">·</span>
        <span className="select-all">{post.pending ? "…" : `#${post.id}`}</span>
        <span className="text-[var(--color-border)]">·</span>
        <RelTime ts={post.createdAt} />
        {post.pending && (
          <span className="font-mono text-xs text-[var(--color-muted)]">{t("post.posting")}</span>
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
        <p className="text-sm italic text-[var(--color-muted)]">{t("post.deleted")}</p>
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
  const { t } = useI18n();

  async function ban() {
    if (!confirm(t("alert.ban_confirm"))) return;
    const reason = prompt(t("alert.ban_reason")) ?? undefined;
    try {
      const res = await fetch(`/api/admin/posts/${postId}/ban`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.error?.message ?? t("alert.ban_failed"));
      } else {
        alert(t("alert.ban_success"));
      }
    } catch {
      alert(t("alert.ban_failed"));
    }
  }

  return (
    <button
      onClick={ban}
      title={t("post.ban")}
      className="font-mono text-[10px] text-[var(--color-muted)] hover:text-[var(--color-danger)]"
    >
      {t("post.ban")}
    </button>
  );
}
