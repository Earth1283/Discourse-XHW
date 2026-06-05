"use client";

import { useSyncExternalStore, useState } from "react";
import Link from "next/link";
import { RULES, RULES_VERSION, LIABILITY_WAIVER } from "@/lib/rules";

const COOKIE = "xhw_rules_accepted";

function getCookieVersion() {
  const entry = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`));
  return entry?.split("=")[1] ?? "";
}

export function RulesGate() {
  // useSyncExternalStore avoids hydration mismatch: server snapshot returns RULES_VERSION
  // (no modal during SSR), client snapshot reads actual cookie after hydration.
  const cookieVersion = useSyncExternalStore(
    () => () => {},
    getCookieVersion,
    () => RULES_VERSION,
  );
  const [dismissed, setDismissed] = useState(false);
  const [checked, setChecked] = useState(false);

  const open = cookieVersion !== RULES_VERSION && !dismissed;
  if (!open) return null;

  function accept() {
    document.cookie = `${COOKIE}=${RULES_VERSION}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setDismissed(true);
  }

  return (
    <div
      role="dialog"
      aria-modal
      data-testid="rules-gate"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="font-mono text-lg lowercase tracking-tight">before you enter</h2>

        <div className="mt-4 rounded-[var(--radius)] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/5 p-3">
          <p className="mb-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-danger)]">
            liability waiver
          </p>
          <p className="text-xs leading-relaxed text-[var(--color-text)]">{LIABILITY_WAIVER}</p>
        </div>

        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[var(--color-muted)]">
          {RULES.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>

        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I am at least 13, I agree to the rules, and I accept the liability waiver above — I
            will not hold the author(s) or operator(s) liable for anything on this site.
          </span>
        </label>

        <button
          onClick={accept}
          disabled={!checked}
          className="mt-6 w-full rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2 font-medium text-[var(--color-accent-ink)] transition-opacity disabled:opacity-40"
        >
          I understand and agree
        </button>

        <p className="mt-3 text-center font-mono text-xs text-[var(--color-muted)]">
          <Link href="/rules" className="hover:underline">
            read full rules
          </Link>
        </p>
      </div>
    </div>
  );
}
