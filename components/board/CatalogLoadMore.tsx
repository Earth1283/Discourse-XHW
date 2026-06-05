"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { ThreadCard } from "./ThreadCard";
import type { ThreadCard as ThreadCardData } from "@/lib/types";
import { useI18n } from "@/lib/i18n/client";

const PER_PAGE = 30;

export function CatalogLoadMore({ board, initialCount }: { board: string; initialCount: number }) {
  const [extra, setExtra] = useState<ThreadCardData[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(initialCount < PER_PAGE);
  const { t } = useI18n();

  async function loadMore() {
    setLoading(true);
    try {
      const data = await apiFetch<ThreadCardData[]>(`/api/boards/${board}/threads?page=${page}`);
      setExtra((prev) => [...prev, ...data]);
      setPage((p) => p + 1);
      if (data.length < PER_PAGE) setExhausted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {extra.map((c) => (
        <ThreadCard key={c.id} card={c} />
      ))}

      {!exhausted && (
        <div className="col-span-full flex justify-center pt-2">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-2 font-mono text-xs text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-40"
          >
            {loading ? t("catalog.loading") : t("catalog.load_more")}
          </button>
        </div>
      )}
    </>
  );
}
