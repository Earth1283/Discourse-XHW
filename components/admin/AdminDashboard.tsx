"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

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

type BoardRow = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  adminOnlyPost: boolean;
  liveThreads: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(ts: number) {
  return new Date(ts).toLocaleString();
}

// ── Reports tab ───────────────────────────────────────────────────────────────

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

  const hardPurge = useMutation({
    mutationFn: (postId: string) =>
      apiFetch(`/api/admin/posts/${postId}/purge`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
      toast.success("Post hard-purged.");
    },
    onError: () => toast.error("Purge failed."),
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
              soft delete
            </button>
            <button
              onClick={() => {
                if (!confirm("Hard-purge? This permanently removes the post row and image files."))
                  return;
                hardPurge.mutate(r.postId);
              }}
              disabled={hardPurge.isPending}
              className="rounded border border-[var(--color-danger)]/50 px-2 py-1 font-mono text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 disabled:opacity-40"
            >
              hard purge
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

// ── Bans tab ──────────────────────────────────────────────────────────────────

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
            <span className="text-[var(--color-muted)]">{b.ipHash.slice(0, 16)}…</span>
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

// ── Threads tab ───────────────────────────────────────────────────────────────

function ThreadsTab() {
  const [threadId, setThreadId] = useState("");
  const [busy, setBusy] = useState(false);

  async function patch(action: "lock" | "unlock" | "pin" | "unpin" | "archive") {
    if (!threadId.trim()) return;
    setBusy(true);
    try {
      const p: Record<string, boolean> = {};
      if (action === "lock") p.isLocked = true;
      if (action === "unlock") p.isLocked = false;
      if (action === "pin") p.isPinned = true;
      if (action === "unpin") p.isPinned = false;
      if (action === "archive") p.isArchived = true;
      await apiFetch(`/api/admin/threads/${threadId.trim()}`, {
        method: "PATCH",
        body: JSON.stringify(p),
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
      <p className="mb-3 font-mono text-xs text-[var(--color-muted)]">Enter thread ID to manage.</p>
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

// ── Boards tab ────────────────────────────────────────────────────────────────

function BoardsTab() {
  const qc = useQueryClient();
  const { data: boardList = [], isLoading } = useQuery({
    queryKey: ["admin", "boards"],
    queryFn: () => apiFetch<BoardRow[]>("/api/admin/boards"),
  });

  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const createBoard = useMutation({
    mutationFn: (body: { id: string; name: string; description: string }) =>
      apiFetch("/api/admin/boards", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "boards"] });
      setNewId("");
      setNewName("");
      setNewDesc("");
      toast.success("Board created.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed."),
  });

  const updateBoard = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      apiFetch(`/api/admin/boards/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "boards"] });
      toast.success("Board updated.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed."),
  });

  const deleteBoard = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/admin/boards/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "boards"] });
      toast.success("Board deleted.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed."),
  });

  if (isLoading) return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;

  return (
    <div className="space-y-4">
      {/* Create form */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <p className="mb-2 font-mono text-xs text-[var(--color-muted)]">new board</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            placeholder="id (e.g. gen)"
            className="w-24 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 font-mono text-xs outline-none focus:border-[var(--color-accent)]"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="display name"
            className="flex-1 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 font-mono text-xs outline-none focus:border-[var(--color-accent)]"
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="description (optional)"
            className="flex-1 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 font-mono text-xs outline-none focus:border-[var(--color-accent)]"
          />
          <button
            onClick={() =>
              createBoard.mutate({ id: newId.trim(), name: newName.trim(), description: newDesc.trim() })
            }
            disabled={createBoard.isPending || !newId.trim() || !newName.trim()}
            className="rounded border border-[var(--color-border)] px-2 py-1 font-mono text-xs hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-40"
          >
            create
          </button>
        </div>
      </div>

      {/* Board list */}
      {boardList.map((b) => (
        <div
          key={b.id}
          className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
        >
          <div className="mb-1.5 flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="text-[var(--color-accent)]">/{b.id}/</span>
            <span className="text-[var(--color-text)]">{b.name}</span>
            <span className="text-[var(--color-muted)]">{b.liveThreads} threads</span>
            {b.adminOnlyPost && (
              <span className="rounded bg-[var(--color-danger)]/10 px-1 text-[var(--color-danger)]">
                admin-only
              </span>
            )}
            <div className="ml-auto flex gap-2">
              <button
                onClick={() =>
                  updateBoard.mutate({ id: b.id, patch: { adminOnlyPost: !b.adminOnlyPost } })
                }
                disabled={updateBoard.isPending}
                className="rounded border border-[var(--color-border)] px-2 py-1 font-mono text-xs hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-40"
              >
                {b.adminOnlyPost ? "open" : "lock post"}
              </button>
              <button
                onClick={() => {
                  const name = prompt("New name:", b.name);
                  if (name && name.trim()) updateBoard.mutate({ id: b.id, patch: { name: name.trim() } });
                }}
                disabled={updateBoard.isPending}
                className="rounded border border-[var(--color-border)] px-2 py-1 font-mono text-xs hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-40"
              >
                rename
              </button>
              <button
                onClick={() => {
                  if (!confirm(`Delete /${b.id}/? Only works if empty.`)) return;
                  deleteBoard.mutate(b.id);
                }}
                disabled={deleteBoard.isPending}
                className="rounded border border-[var(--color-danger)]/50 px-2 py-1 font-mono text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 disabled:opacity-40"
              >
                delete
              </button>
            </div>
          </div>
          {b.description && (
            <p className="font-mono text-xs text-[var(--color-muted)]">{b.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Maintenance tab ───────────────────────────────────────────────────────────

function MaintenanceTab() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function runPurge() {
    setBusy(true);
    setResult(null);
    try {
      const res = await apiFetch<{ purged: number }>("/api/admin/purge-orphans", {
        method: "POST",
      });
      setResult(`Purged image files for ${res.purged} deleted posts.`);
      toast.success(`Purged ${res.purged} orphan image sets.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Purge failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <p className="mb-1 font-mono text-xs text-[var(--color-text)]">purge orphan images</p>
        <p className="mb-3 font-mono text-xs text-[var(--color-muted)]">
          Deletes image files for posts soft-deleted more than 30 days ago. Irreversible.
        </p>
        <button
          onClick={runPurge}
          disabled={busy}
          className="rounded border border-[var(--color-danger)]/50 px-3 py-1.5 font-mono text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 disabled:opacity-40"
        >
          {busy ? "running…" : "run purge"}
        </button>
        {result && (
          <p className="mt-2 font-mono text-xs text-[var(--color-muted)]">{result}</p>
        )}
      </div>
    </div>
  );
}

// ── Dashboard shell ───────────────────────────────────────────────────────────

type Tab = "reports" | "bans" | "threads" | "boards" | "maintenance";

const TABS: { id: Tab; label: string }[] = [
  { id: "reports", label: "reports" },
  { id: "bans", label: "bans" },
  { id: "threads", label: "threads" },
  { id: "boards", label: "boards" },
  { id: "maintenance", label: "maintenance" },
];

export function AdminDashboard({ handle }: { handle: string }) {
  const [tab, setTab] = useState<Tab>("reports");

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
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-[var(--color-border)] pb-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-t px-3 py-1.5 font-mono text-xs transition-colors",
              tab === t.id
                ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "reports" && <ReportsTab />}
      {tab === "bans" && <BansTab />}
      {tab === "threads" && <ThreadsTab />}
      {tab === "boards" && <BoardsTab />}
      {tab === "maintenance" && <MaintenanceTab />}
    </div>
  );
}
