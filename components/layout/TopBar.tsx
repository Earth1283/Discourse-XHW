"use client";

import Link from "next/link";
import { SunMoon } from "lucide-react";
import type { BoardDTO } from "@/lib/types";
import { cn } from "@/lib/cn";
import { AuthMenu } from "./AuthMenu";
import { SearchBar } from "./SearchBar";

// Theme is applied directly to the DOM (the pre-paint script in the root layout
// sets the initial value). No React state — avoids hydration mismatch on the icon.
function toggleTheme() {
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const next = isLight ? "dark" : "light";
  if (next === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
  try {
    localStorage.setItem("xhw-theme", next);
  } catch {
    // ignore storage failures (private mode, etc.)
  }
}

export function TopBar({ boards }: { boards: BoardDTO[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-bg)_80%,transparent)] backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-2.5">
        <Link href="/" className="font-mono text-base lowercase tracking-tight">
          xhw<span className="text-[var(--color-accent)]"> life</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {boards.map((b) => (
            <Link
              key={b.id}
              href={`/b/${b.id}`}
              className={cn(
                "shrink-0 rounded px-1.5 py-0.5 font-mono text-xs text-[var(--color-muted)]",
                "hover:bg-[var(--color-surface-2)] hover:text-[var(--color-accent)]",
              )}
            >
              /{b.id}/
            </Link>
          ))}
        </nav>

        <SearchBar />

        <AuthMenu />

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="rounded p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
        >
          <SunMoon size={16} />
        </button>
      </div>
    </header>
  );
}
