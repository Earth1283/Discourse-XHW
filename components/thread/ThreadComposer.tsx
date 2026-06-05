"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Thread } from "@/lib/db/schema";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";

export function ThreadComposer({ board }: { board: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<{ thread: Thread }>(`/api/boards/${board}/threads`, {
        method: "POST",
        body: JSON.stringify({ title: title || undefined, body, name: name || undefined }),
      });
      router.push(`/b/${board}/${data.thread.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create thread.");
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="mb-6">
        <Button onClick={() => setOpen(true)}>+ New thread</Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mb-6 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Subject (optional)"
          className="flex-1 min-w-48"
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Anonymous (name#trip)"
          className="w-52"
        />
      </div>
      <TextArea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What's on your mind? (image support coming soon)"
        rows={4}
      />
      {error && <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p>}
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy || !body.trim()}>
          {busy ? "Posting…" : "Post thread"}
        </Button>
      </div>
    </form>
  );
}
