"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Providers } from "@/app/providers";
import { useI18n } from "@/lib/i18n/client";

function AdminLoginForm() {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { t } = useI18n();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await apiFetch("/api/auth/admin", {
        method: "POST",
        body: JSON.stringify({ handle, password }),
      });
      router.push("/admin");
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("admin.login.failed"));
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-xs rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      >
        <h1 className="mb-5 font-mono text-sm lowercase tracking-tight text-[var(--color-text)]">
          {t("admin.login.title")}
        </h1>
        <input
          type="text"
          placeholder={t("admin.login.placeholder.handle")}
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          autoComplete="username"
          className={cn(
            "mb-2 w-full rounded-[var(--radius)] border border-[var(--color-border)]",
            "bg-[var(--color-surface-2)] px-3 py-2 font-mono text-sm outline-none",
            "focus:border-[var(--color-accent)]",
          )}
        />
        <input
          type="password"
          placeholder={t("admin.login.placeholder.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className={cn(
            "mb-3 w-full rounded-[var(--radius)] border border-[var(--color-border)]",
            "bg-[var(--color-surface-2)] px-3 py-2 font-mono text-sm outline-none",
            "focus:border-[var(--color-accent)]",
          )}
        />
        {err && <p className="mb-3 text-xs text-[var(--color-danger)]">{err}</p>}
        <button
          type="submit"
          disabled={busy || !handle || !password}
          className="w-full rounded-[var(--radius)] bg-[var(--color-accent)] py-2 font-mono text-sm font-medium text-[var(--color-accent-ink)] disabled:opacity-40"
        >
          {busy ? "…" : t("admin.login.button")}
        </button>
      </form>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Providers>
      <AdminLoginForm />
    </Providers>
  );
}
