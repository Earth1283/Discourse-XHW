"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ClassicalTooltip, DictTooltipOverlay, fetchDict, type DictEntry } from "./ClassicalTooltip";
import { useI18n } from "@/lib/i18n/client";

const CJK = /[㐀-鿿豈-﫿]/;

type Token = { text: string; cjk: boolean };

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  for (const ch of text) {
    if (CJK.test(ch)) {
      tokens.push({ text: ch, cjk: true });
    } else {
      const prev = tokens[tokens.length - 1];
      if (prev && !prev.cjk) prev.text += ch;
      else tokens.push({ text: ch, cjk: false });
    }
  }
  return tokens;
}

interface SelState {
  pos: { x: number; y: number; above: boolean };
  entry: DictEntry | null | "loading";
  word: string;
}

export function ClassicalText({ text }: { text: string }) {
  const { locale } = useI18n();
  const tokens = useMemo(() => tokenize(text), [text]);
  const containerRef = useRef<HTMLSpanElement>(null);
  const selTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [sel, setSel] = useState<SelState | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (locale !== "lzh" || !mounted) return;

    function onSelChange() {
      clearTimeout(selTimer.current);

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setSel(null);
        return;
      }

      const range = selection.getRangeAt(0);
      if (!containerRef.current?.contains(range.commonAncestorContainer)) {
        return;
      }

      const raw = selection.toString();
      const cjk = [...raw].filter((ch) => CJK.test(ch)).join("");
      if (cjk.length < 2) return;

      const query = cjk.slice(0, 8);

      selTimer.current = setTimeout(async () => {
        const rect = range.getBoundingClientRect();
        const TOOLTIP_H = 96;
        const TOOLTIP_W = 208;
        const above = rect.bottom + TOOLTIP_H + 8 > window.innerHeight;
        const rawX = rect.left + window.scrollX + (rect.width / 2) - TOOLTIP_W / 2;

        setSel({
          pos: {
            x: Math.max(Math.min(rawX, window.scrollX + window.innerWidth - TOOLTIP_W - 8), window.scrollX + 8),
            y: above ? rect.top + window.scrollY - TOOLTIP_H - 4 : rect.bottom + window.scrollY + 4,
            above,
          },
          entry: "loading",
          word: query,
        });

        const result = await fetchDict(query);
        setSel((prev) => prev ? { ...prev, entry: result } : null);
      }, 1500);
    }

    document.addEventListener("selectionchange", onSelChange);
    return () => {
      document.removeEventListener("selectionchange", onSelChange);
      clearTimeout(selTimer.current);
    };
  }, [locale, mounted]);

  if (locale !== "lzh") return <>{text}</>;

  return (
    <>
      <span ref={containerRef}>
        {tokens.map((tok, i) =>
          tok.cjk ? (
            <ClassicalTooltip key={i} word={tok.text}>
              {tok.text}
            </ClassicalTooltip>
          ) : (
            <span key={i}>{tok.text}</span>
          ),
        )}
      </span>

      {mounted && sel && createPortal(
        <DictTooltipOverlay
          pos={sel.pos}
          entry={sel.entry}
          word={sel.word}
          onHide={() => setSel(null)}
        />,
        document.body,
      )}
    </>
  );
}
