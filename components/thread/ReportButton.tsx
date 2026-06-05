"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";

export function ReportButton({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await apiFetch(`/api/posts/${postId}/report`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      toast.success("Reported.");
      setOpen(false);
      setReason("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Report failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Report post"
        className="text-[var(--color-muted)] hover:text-[var(--color-danger)]"
      >
        <Flag size={12} />
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
            <h2 className="mb-3 font-mono text-sm lowercase">report post #{postId}</h2>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              rows={3}
              maxLength={300}
              className="mb-3 w-full resize-none rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            />
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
                disabled={busy}
                className="flex-1 rounded-[var(--radius)] bg-[var(--color-danger)] py-2 font-mono text-xs font-medium text-white disabled:opacity-40"
              >
                {busy ? "…" : "report"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
