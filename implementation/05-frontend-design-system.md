# 05 — Frontend Design System

> Brief: **minimal, sleek, modern.** The interface is calm so the content can be loud. Build with the `frontend-design` skill to avoid generic AI-template look.

## Design principles

1. **Content-first.** Chrome is hairline-thin. No drop shadows everywhere, no gradients-for-the-sake-of-it.
2. **Monochrome + one accent.** Near-black/near-white base, a single saturated accent for actions, greentext, active state.
3. **Type does the work.** A clean variable sans for UI, a mono for metadata/IDs — gives a subtle terminal edge.
4. **Dark mode is the default**, light mode supported.
5. **Restrained motion.** 120–180ms ease-out. Optimistic posts fade+slide in. No bounce.
6. **Density that breathes.** Generous line-height in post bodies; tight, quiet metadata rows.

## Tokens — `app/globals.css`

```css
@import "tailwindcss";

@theme {
  /* base (dark-first) */
  --color-bg:        oklch(0.16 0.01 260);
  --color-surface:   oklch(0.20 0.012 260);
  --color-surface-2: oklch(0.24 0.014 260);
  --color-border:    oklch(0.30 0.012 260);
  --color-text:      oklch(0.93 0.01 260);
  --color-muted:     oklch(0.66 0.012 260);

  /* accent — pick ONE in 11-open-questions; default: acid green */
  --color-accent:    oklch(0.83 0.19 135);
  --color-accent-ink: oklch(0.20 0.05 135);

  /* semantic */
  --color-greentext: oklch(0.80 0.17 140);
  --color-quote:     oklch(0.75 0.14 250);
  --color-danger:    oklch(0.68 0.20 25);

  --radius: 0.5rem;
  --font-sans: "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;
}

:root[data-theme="light"] {
  --color-bg: oklch(0.99 0 0);
  --color-surface: oklch(0.97 0.003 260);
  --color-surface-2: oklch(0.94 0.004 260);
  --color-border: oklch(0.88 0.004 260);
  --color-text: oklch(0.20 0.01 260);
  --color-muted: oklch(0.50 0.01 260);
}

html { background: var(--color-bg); color: var(--color-text); }
body { font-family: var(--font-sans); }
```

Load fonts with `next/font` (Geist + Geist Mono are first-party). Add a `data-theme` toggle that flips `:root` and persists to `localStorage`.

## Accent options (decide later)
- Acid green `oklch(0.83 0.19 135)` — default, "terminal" energy.
- Electric blue `oklch(0.72 0.18 250)`.
- Hot magenta `oklch(0.70 0.25 350)`.

Changing the accent = one token. Keep components accent-agnostic.

## Primitive components — `components/ui/`

Use `clsx` + `tailwind-merge` (`cn()` helper). Examples:

```tsx
// components/ui/Button.tsx
import { cn } from "@/lib/cn";
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};
export function Button({ variant = "primary", className, ...p }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius)] px-3 py-1.5 text-sm font-medium",
        "transition-colors duration-150 disabled:opacity-50 focus-visible:outline-2",
        "focus-visible:outline-[var(--color-accent)]",
        variant === "primary" &&
          "bg-[var(--color-accent)] text-[var(--color-accent-ink)] hover:brightness-110",
        variant === "ghost" &&
          "bg-transparent text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
        variant === "danger" &&
          "bg-transparent text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10",
        className,
      )}
      {...p}
    />
  );
}
```

Other primitives to build: `Modal` (focus-trapped, used by rules gate + composer on mobile), `TextArea` (auto-grow), `Toast` (mutation feedback), `Tag`/`Pill` (board codes), `Spinner`, `IconButton`, `EmptyState`.

## Layout shell — `components/layout/TopBar.tsx`
- Sticky, `backdrop-blur`, hairline bottom border.
- Left: `SSBS` wordmark (mono, lowercase). Middle/over: `BoardSwitcher` (compact dropdown of board codes). Right: theme toggle + "New thread" button + (if session) handle/admin link.
- Mobile: wordmark + hamburger → sheet with boards.

## Post metadata row style
Mono, muted, small: `Anonymous` (or `name` + accent-colored `!tripcode`) · `#postId` · relative time (`2m`). The `#postId` is a click target that inserts `>>postId` into the composer (4chan behavior).

## Iconography
`lucide-react`, 16–18px, `stroke-width: 1.75`. Used sparingly: reply, image, flag, trash, pin, lock.

## Accessibility floor
- All interactive elements keyboard-reachable, visible focus rings (accent outline).
- Modal focus trap + `Esc` to close + restore focus.
- Color is never the only signal (icons + text on greentext/quote/danger).
- Respect `prefers-reduced-motion` → disable slide/fade.

## Exit criteria
- A storybook-ish `/_kitchensink` (dev-only) page renders every primitive in dark + light.
- Switching accent token recolors the whole app with no component edits.
