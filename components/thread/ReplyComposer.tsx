"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";

export function ReplyComposer({ threadId, locked }: { threadId: string; locked: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [sage, setSage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (locked) {
    return (
      <p className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-muted)]">
        🔒 This thread is locked.
      </p>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/threads/${threadId}/posts`, {
        method: "POST",
        body: JSON.stringify({ body, name: name || undefined, sage }),
      });
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Anonymous (name#tripcode optional)"
          className="flex-1 min-w-48"
        />
        <label className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-muted)]">
          <input type="checkbox" checked={sage} onChange={(e) => setSage(e.target.checked)} />
          sage
        </label>
      </div>
      <TextArea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Reply… (>greentext, >>postid, [s]spoiler[/s])"
        rows={3}
      />
      {error && <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p>}
      <div className="mt-2 flex justify-end">
        <Button type="submit" disabled={busy || !body.trim()}>
          {busy ? "Posting…" : "Reply"}
        </Button>
      </div>
    </form>
  );
}
