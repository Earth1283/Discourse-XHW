"use client";

import { useState } from "react";
import { renderBody, type Segment } from "@/lib/format/render";
import { cn } from "@/lib/cn";

function Spoiler({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      onClick={() => setRevealed(true)}
      className={cn(
        "cursor-pointer rounded px-0.5 transition-colors",
        revealed
          ? "bg-[var(--color-surface-2)]"
          : "bg-[var(--color-text)] text-transparent select-none",
      )}
    >
      {children}
    </span>
  );
}

function Segments({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((s, i) => {
        switch (s.t) {
          case "text":
            return <span key={i}>{s.v}</span>;
          case "quote":
            return (
              <a
                key={i}
                href={`#p-${s.postId}`}
                className="text-[var(--color-quote)] hover:underline"
              >
                {`>>${s.postId}`}
              </a>
            );
          case "link":
            return (
              <a
                key={i}
                href={s.v}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] underline underline-offset-2 hover:brightness-110"
              >
                {s.v}
              </a>
            );
          case "spoiler":
            return (
              <Spoiler key={i}>
                <Segments segments={s.children} />
              </Spoiler>
            );
        }
      })}
    </>
  );
}

export function PostBody({ body }: { body: string }) {
  const lines = renderBody(body);
  return (
    <div className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
      {lines.map((line, i) => (
        <div key={i} className={line.greentext ? "text-[var(--color-greentext)]" : undefined}>
          <Segments segments={line.segments} />
          {line.segments.length === 0 ? " " : null}
        </div>
      ))}
    </div>
  );
}
