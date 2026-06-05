import Link from "next/link";
import { Pin, Lock, MessageSquare } from "lucide-react";
import type { ThreadCard as ThreadCardData } from "@/lib/types";
import { RelTime } from "@/components/RelTime";

export function ThreadCard({ card }: { card: ThreadCardData }) {
  return (
    <Link
      href={`/b/${card.boardId}/${card.id}`}
      className="group flex flex-col rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[color-mix(in_oklch,var(--color-accent)_50%,var(--color-border))]"
    >
      {card.thumbPath && (
        <div className="overflow-hidden rounded-t-[var(--radius)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.thumbPath}
            alt=""
            className="h-40 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-3">
        {card.title && (
          <div className="mb-1 font-medium leading-tight text-[var(--color-text)]">{card.title}</div>
        )}
        <p className="line-clamp-4 whitespace-pre-wrap text-sm text-[var(--color-muted)]">
          {card.excerpt || "(no text)"}
        </p>
        <div className="mt-3 flex items-center gap-2 font-mono text-xs text-[var(--color-muted)]">
          {card.isPinned && <Pin size={12} className="text-[var(--color-accent)]" />}
          {card.isLocked && <Lock size={12} />}
          <span className="flex items-center gap-1">
            <MessageSquare size={12} /> {card.replyCount}
          </span>
          <span className="text-[var(--color-border)]">·</span>
          <RelTime ts={card.bumpedAt} />
        </div>
      </div>
    </Link>
  );
}
