"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(null);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      if (title) fd.append("title", title);
      fd.append("body", body);
      if (name) fd.append("name", name);
      if (imageFile) fd.append("image", imageFile);

      const data = await apiFetch<{ thread: Thread }>(`/api/boards/${board}/threads`, {
        method: "POST",
        body: fd,
      });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
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
          className="min-w-48 flex-1"
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Anonymous (name#trip)"
          className="w-52"
        />
      </div>

      {previewUrl && (
        <div className="relative mb-2 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="preview"
            className="max-h-48 max-w-full rounded-[calc(var(--radius)-2px)] object-contain"
          />
          <button
            type="button"
            onClick={clearFile}
            className="absolute -right-1.5 -top-1.5 rounded-full bg-[var(--color-surface-2)] p-0.5 text-[var(--color-muted)] hover:text-[var(--color-danger)]"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <TextArea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What's on your mind?"
        rows={4}
      />
      {error && <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p>}

      <div className="mt-2 flex items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]">
          <ImagePlus size={14} />
          <span>{imageFile ? imageFile.name.slice(0, 20) : "image"}</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={pickFile}
            className="sr-only"
          />
        </label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              clearFile();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !body.trim()}>
            {busy ? "Posting…" : "Post thread"}
          </Button>
        </div>
      </div>
    </form>
  );
}
