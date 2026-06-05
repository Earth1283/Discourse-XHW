"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

export type DictEntry = { pinyin: string; definition: string };

export const dictCache = new Map<string, DictEntry | null>();

export async function fetchDict(word: string): Promise<DictEntry | null> {
  if (dictCache.has(word)) return dictCache.get(word)!;
  try {
    const res = await fetch(`/api/dict?q=${encodeURIComponent(word)}`);
    const data = res.ok ? (await res.json() as DictEntry) : null;
    const val = data?.definition ? data : null;
    dictCache.set(word, val);
    return val;
  } catch {
    dictCache.set(word, null);
    return null;
  }
}

interface Pos { x: number; y: number; above: boolean }

export function DictTooltipOverlay({
  pos,
  entry,
  word,
  onHide,
}: {
  pos: Pos;
  entry: DictEntry | null | "loading";
  word?: string;
  onHide: () => void;
}) {
  return (
    <div
      role="tooltip"
      style={{ position: "absolute", left: pos.x, top: pos.y, zIndex: 9999 }}
      className="w-52 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-xs shadow-xl"
      onMouseEnter={() => {/* keep open */}}
      onMouseLeave={onHide}
    >
      {entry === "loading" && (
        <span className="animate-pulse text-[var(--color-muted)]">…</span>
      )}
      {entry === null && (
        <span className="text-[var(--color-muted)]">查無此字</span>
      )}
      {entry && entry !== "loading" && (
        <>
          {entry.pinyin && (
            <div className="mb-1 font-mono text-[10px] tracking-wider text-[var(--color-accent)]">
              {entry.pinyin}
            </div>
          )}
          <div className="leading-relaxed text-[var(--color-text)]">{entry.definition}</div>
          {word && (
            <a
              href={`https://www.zdic.net/hans/${encodeURIComponent(word)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block font-mono text-[10px] text-[var(--color-muted)] hover:text-[var(--color-accent)] hover:underline"
            >
              zdic →
            </a>
          )}
        </>
      )}
    </div>
  );
}

export function ClassicalTooltip({
  word,
  children,
}: {
  word: string;
  children: React.ReactNode;
}) {
  const [entry, setEntry] = useState<DictEntry | null | "loading">(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(async () => {
    setEntry("loading");
    const val = await fetchDict(word);
    setEntry(val);
  }, [word]);

  function show() {
    clearTimeout(hideTimer.current);
    clearTimeout(showTimer.current);
    showTimer.current = setTimeout(() => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const TOOLTIP_H = 96;
      const TOOLTIP_W = 208;
      const above = rect.bottom + TOOLTIP_H + 8 > window.innerHeight;
      const rawX = rect.left + window.scrollX;
      setPos({
        x: Math.max(Math.min(rawX, window.scrollX + window.innerWidth - TOOLTIP_W - 8), window.scrollX + 8),
        y: above ? rect.top + window.scrollY - TOOLTIP_H - 4 : rect.bottom + window.scrollY + 4,
        above,
      });
      if (!dictCache.has(word)) load();
      else setEntry(dictCache.get(word) ?? null);
    }, 750);
  }

  function hide() {
    clearTimeout(showTimer.current);
    hideTimer.current = setTimeout(() => setPos(null), 200);
  }

  return (
    <>
      <span
        ref={triggerRef}
        className="inline cursor-help border-b border-dotted border-[var(--color-muted)]/50 hover:border-[var(--color-accent)]/80"
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </span>

      {mounted && pos && createPortal(
        <DictTooltipOverlay pos={pos} entry={entry} word={word} onHide={hide} />,
        document.body,
      )}
    </>
  );
}
