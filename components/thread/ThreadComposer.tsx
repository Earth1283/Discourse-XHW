"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Thread } from "@/lib/db/schema";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { useI18n } from "@/lib/i18n/client";

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
  const { t } = useI18n();

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
      setError(err instanceof Error ? err.message : t("composer.thread_failed"));
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="mb-6">
        <Button onClick={() => setOpen(true)} data-testid="new-thread-btn">{t("composer.new_thread")}</Button>
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
          placeholder={t("composer.subject_placeholder")}
          className="min-w-48 flex-1"
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("composer.anonymous_placeholder")}
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
        placeholder={t("composer.body_placeholder_thread")}
        data-testid="thread-body-input"
        rows={4}
      />
      {error && <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p>}

      <div className="mt-2 flex items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]">
          <ImagePlus size={14} />
          <span>{imageFile ? imageFile.name.slice(0, 20) : t("composer.image")}</span>
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
            {t("composer.cancel")}
          </Button>
          <Button type="submit" disabled={busy || !body.trim()} data-testid="thread-post-btn">
            {busy ? t("composer.posting") : t("composer.post_thread")}
          </Button>
        </div>
      </div>
    </form>
  );
}
