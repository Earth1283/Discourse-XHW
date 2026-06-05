import Link from "next/link";
import { RULES, LIABILITY_WAIVER } from "@/lib/rules";

export default function RulesPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-6">
        <Link href="/" className="font-mono text-xs text-[var(--color-muted)] hover:underline">
          ← home
        </Link>
        <h1 className="mt-1 font-mono text-xl lowercase tracking-tight">rules</h1>
      </div>

      <div className="rounded-[var(--radius)] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/5 p-4">
        <p className="mb-2 font-mono text-xs uppercase tracking-wider text-[var(--color-danger)]">
          liability waiver
        </p>
        <p className="text-sm leading-relaxed text-[var(--color-text)]">{LIABILITY_WAIVER}</p>
      </div>

      <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm text-[var(--color-muted)]">
        {RULES.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ol>
    </main>
  );
}
