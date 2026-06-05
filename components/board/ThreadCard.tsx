import Link from "next/link";
import { Pin, Lock, MessageSquare } from "lucide-react";
import type { ThreadCard as ThreadCardData } from "@/lib/types";
import { RelTime } from "@/components/RelTime";

export function ThreadCard({ card }: { card: ThreadCardData }) {
  return (
    <Link
      href={`/b/${card.boardId}/${card.id}`}
      className="group flex flex-col rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors hover:border-[color-mix(in_oklch,var(--color-accent)_50%,var(--color-border))]"
    >
      {card.title && (
        <div className="mb-1 leading-tight font-medium text-[var(--color-text)]">{card.title}</div>
      )}
      <p className="line-clamp-4 text-sm whitespace-pre-wrap text-[var(--color-muted)]">
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
    </Link>
  );
}
