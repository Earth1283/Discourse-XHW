"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { SearchResult } from "@/lib/types";

function useDebounce(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data = [] } = useQuery({
    queryKey: ["search", dq],
    queryFn: () => apiFetch<SearchResult[]>(`/api/search?q=${encodeURIComponent(dq)}`),
    enabled: dq.length >= 2,
    staleTime: 30_000,
  });

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleIconClick() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  const showResults = open && dq.length >= 2;

  return (
    <div ref={containerRef} className="relative">
      {open ? (
        <div className="flex items-center gap-1 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1">
          <Search size={12} className="shrink-0 text-[var(--color-muted)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && (setOpen(false), setQ(""))}
            placeholder="search posts…"
            className="w-36 bg-transparent font-mono text-xs outline-none placeholder:text-[var(--color-muted)]"
          />
        </div>
      ) : (
        <button
          onClick={handleIconClick}
          aria-label="Search"
          className="rounded p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
        >
          <Search size={16} />
        </button>
      )}

      {showResults && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
          {data.length === 0 ? (
            <p className="px-3 py-2 font-mono text-xs text-[var(--color-muted)]">No results.</p>
          ) : (
            <ul>
              {data.map((r) => (
                <li key={r.postId}>
                  <Link
                    href={`/b/${r.boardId}/${r.threadId}#p-${r.postId}`}
                    onClick={() => { setOpen(false); setQ(""); }}
                    className="block px-3 py-2 hover:bg-[var(--color-surface-2)]"
                  >
                    <div className="font-mono text-[10px] text-[var(--color-muted)]">
                      /{r.boardId}/ · #{r.postId}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-text)]">
                      {r.excerpt}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
