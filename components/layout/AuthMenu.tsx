"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/hooks/useSession";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";

export function AuthMenu() {
  const session = useSession();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await apiFetch("/api/auth/handle", {
        method: "POST",
        body: JSON.stringify({ handle, password }),
      });
      await qc.invalidateQueries({ queryKey: ["session"] });
      setOpen(false);
      setHandle("");
      setPassword("");
      toast.success("Logged in.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    await qc.invalidateQueries({ queryKey: ["session"] });
    toast.info("Logged out.");
  }

  if (session) {
    return (
      <div className="flex items-center gap-2 font-mono text-xs text-[var(--color-muted)]">
        {session.role === "admin" && (
          <Link
            href="/admin"
            className="rounded px-1.5 py-0.5 text-[var(--color-accent)] hover:bg-[var(--color-surface-2)]"
          >
            admin
          </Link>
        )}
        <span className="text-[var(--color-text)]">@{session.handle}</span>
        <button
          onClick={logout}
          className="rounded px-1.5 py-0.5 hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
        >
          out
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded px-1.5 py-0.5 font-mono text-xs text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
      >
        handle
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <form
            onSubmit={submit}
            className="w-full max-w-xs rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <h2 className="mb-4 font-mono text-sm lowercase tracking-tight">
              claim or log in
            </h2>
            <input
              type="text"
              placeholder="handle"
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
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={cn(
                "mb-1 w-full rounded-[var(--radius)] border border-[var(--color-border)]",
                "bg-[var(--color-surface-2)] px-3 py-2 font-mono text-sm outline-none",
                "focus:border-[var(--color-accent)]",
              )}
            />
            {err && <p className="mb-2 text-xs text-[var(--color-danger)]">{err}</p>}
            <p className="mb-3 font-mono text-xs text-[var(--color-muted)]">
              new handle? claiming it creates your account.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-[var(--radius)] border border-[var(--color-border)] py-2 font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                cancel
              </button>
              <button
                type="submit"
                disabled={busy || !handle || !password}
                className="flex-1 rounded-[var(--radius)] bg-[var(--color-accent)] py-2 font-mono text-xs font-medium text-[var(--color-accent-ink)] disabled:opacity-40"
              >
                {busy ? "…" : "go"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
