"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";

// ── Types ────────────────────────────────────────────────────────────────────

type ReportRow = {
  id: string;
  postId: string;
  reason: string | null;
  createdAt: number;
  postBody: string | null;
  postBoardId: string;
  postThreadId: string;
};

type BanRow = {
  ipHash: string;
  reason: string | null;
  createdAt: number;
  expiresAt: number | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(ts: number) {
  return new Date(ts).toLocaleString();
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "reports" | "bans";

// ── Reports tab ──────────────────────────────────────────────────────────────

function ReportsTab() {
  const qc = useQueryClient();
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: () => apiFetch<ReportRow[]>("/api/admin/reports"),
    refetchInterval: 30_000,
  });

  const resolve = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "resolve" | "delete_post" }) =>
      apiFetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
      toast.success("Done.");
    },
    onError: () => toast.error("Action failed."),
  });

  const banPoster = useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason?: string }) =>
      apiFetch(`/api/admin/posts/${postId}/ban`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => toast.success("Poster banned."),
    onError: () => toast.error("Ban failed."),
  });

  if (isLoading) return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  if (reports.length === 0)
    return <p className="font-mono text-sm text-[var(--color-muted)]">No open reports.</p>;

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <div
          key={r.id}
          className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
        >
          <div className="mb-1.5 flex flex-wrap items-center gap-2 font-mono text-xs text-[var(--color-muted)]">
            <span className="text-[var(--color-text)]">#{r.postId}</span>
            <span>·</span>
            <span>{fmt(r.createdAt)}</span>
            {r.reason && (
              <>
                <span>·</span>
                <span className="italic">{r.reason}</span>
              </>
            )}
            <a
              href={`/b/${r.postBoardId}/${r.postThreadId}#p-${r.postId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-[var(--color-accent)] hover:underline"
            >
              view →
            </a>
          </div>

          {r.postBody && (
            <p className="mb-2 line-clamp-3 whitespace-pre-wrap text-sm text-[var(--color-muted)]">
              {r.postBody}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => resolve.mutate({ id: r.id, action: "resolve" })}
              disabled={resolve.isPending}
              className="rounded border border-[var(--color-border)] px-2 py-1 font-mono text-xs hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-40"
            >
              resolve
            </button>
            <button
              onClick={() => resolve.mutate({ id: r.id, action: "delete_post" })}
              disabled={resolve.isPending}
              className="rounded border border-[var(--color-danger)]/50 px-2 py-1 font-mono text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 disabled:opacity-40"
            >
              delete post
            </button>
            <button
              onClick={() => {
                const reason = prompt("Ban reason (optional):") ?? undefined;
                banPoster.mutate({ postId: r.postId, reason });
              }}
              disabled={banPoster.isPending}
              className="rounded border border-[var(--color-danger)]/50 px-2 py-1 font-mono text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 disabled:opacity-40"
            >
              ban poster
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Bans tab ─────────────────────────────────────────────────────────────────

function BansTab() {
  const qc = useQueryClient();
  const { data: bans = [], isLoading } = useQuery({
    queryKey: ["admin", "bans"],
    queryFn: () => apiFetch<BanRow[]>("/api/admin/bans"),
  });

  const lift = useMutation({
    mutationFn: (hash: string) =>
      apiFetch(`/api/admin/bans/${encodeURIComponent(hash)}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "bans"] });
      toast.success("Ban lifted.");
    },
    onError: () => toast.error("Failed to lift ban."),
  });

  if (isLoading) return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  if (bans.length === 0)
    return <p className="font-mono text-sm text-[var(--color-muted)]">No active bans.</p>;

  return (
    <div className="space-y-2">
      {bans.map((b) => (
        <div
          key={b.ipHash}
          className="flex flex-wrap items-center gap-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
        >
          <div className="flex-1 font-mono text-xs">
            <span className="text-[var(--color-muted)]">
              {b.ipHash.slice(0, 16)}…
            </span>
            {b.reason && (
              <span className="ml-2 text-[var(--color-text)]">{b.reason}</span>
            )}
            <span className="ml-2 text-[var(--color-muted)]">
              {b.expiresAt ? `expires ${fmt(b.expiresAt)}` : "permanent"}
            </span>
          </div>
          <button
            onClick={() => lift.mutate(b.ipHash)}
            disabled={lift.isPending}
            className="rounded border border-[var(--color-border)] px-2 py-1 font-mono text-xs hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-40"
          >
            lift
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Thread lookup ─────────────────────────────────────────────────────────────

function ThreadsTab() {
  const [threadId, setThreadId] = useState("");
  const [busy, setBusy] = useState(false);

  async function patch(action: "lock" | "unlock" | "pin" | "unpin" | "archive") {
    if (!threadId.trim()) return;
    setBusy(true);
    try {
      const patch: Record<string, boolean> = {};
      if (action === "lock") patch.isLocked = true;
      if (action === "unlock") patch.isLocked = false;
      if (action === "pin") patch.isPinned = true;
      if (action === "unpin") patch.isPinned = false;
      if (action === "archive") patch.isArchived = true;
      await apiFetch(`/api/admin/threads/${threadId.trim()}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      toast.success(`Thread ${action}ed.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="mb-3 font-mono text-xs text-[var(--color-muted)]">
        Enter a thread ID to manage it.
      </p>
      <input
        value={threadId}
        onChange={(e) => setThreadId(e.target.value)}
        placeholder="Thread ID"
        className="mb-3 w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 font-mono text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <div className="flex flex-wrap gap-2">
        {(["lock", "unlock", "pin", "unpin", "archive"] as const).map((a) => (
          <button
            key={a}
            onClick={() => patch(a)}
            disabled={busy || !threadId.trim()}
            className={cn(
              "rounded border px-2 py-1 font-mono text-xs disabled:opacity-40",
              a === "archive"
                ? "border-[var(--color-danger)]/50 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                : "border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
            )}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Dashboard shell ───────────────────────────────────────────────────────────

export function AdminDashboard({ handle }: { handle: string }) {
  const [tab, setTab] = useState<Tab>("reports");

  const tabs: { id: Tab; label: string }[] = [
    { id: "reports", label: "reports" },
    { id: "bans", label: "bans" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-mono text-base lowercase tracking-tight">
          xhw<span className="text-[var(--color-accent)]"> life</span>
          <span className="ml-2 text-[var(--color-muted)]">/ admin</span>
        </h1>
        <span className="font-mono text-xs text-[var(--color-muted)]">@{handle}</span>
      </div>

      {/* Tab nav */}
      <div className="mb-5 flex gap-1 border-b border-[var(--color-border)] pb-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-t px-3 py-1.5 font-mono text-xs transition-colors",
              tab === t.id
                ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
            )}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={() => setTab("threads" as Tab)}
          className={cn(
            "rounded-t px-3 py-1.5 font-mono text-xs transition-colors",
            (tab as string) === "threads"
              ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]"
              : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
          )}
        >
          threads
        </button>
      </div>

      {tab === "reports" && <ReportsTab />}
      {tab === "bans" && <BansTab />}
      {(tab as string) === "threads" && <ThreadsTab />}
    </div>
  );
}
