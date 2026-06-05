"use client";

import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { qk } from "@/lib/query/keys";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import type { PostDTO, ThreadData } from "@/lib/types";

export function ReplyComposer({
  threadId,
  boardId,
  locked,
}: {
  threadId: string;
  boardId: string;
  locked: boolean;
}) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [sage, setSage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  const { mutate, isPending } = useMutation({
    mutationFn: (fd: FormData) =>
      apiFetch<PostDTO>(`/api/threads/${threadId}/posts`, { method: "POST", body: fd }),

    onMutate: async (fd) => {
      await qc.cancelQueries({ queryKey: qk.thread(threadId) });
      const prev = qc.getQueryData<ThreadData>(qk.thread(threadId));
      const tempId = `temp-${crypto.randomUUID()}`;
      const now = Date.now();
      const localPreview = previewUrl; // capture before state reset
      const optimistic: PostDTO = {
        id: tempId,
        threadId,
        boardId,
        isOp: false,
        name: (fd.get("name") as string) || "Anonymous",
        tripcode: null,
        body: (fd.get("body") as string) ?? "",
        imagePath: localPreview,
        thumbPath: localPreview,
        createdAt: now,
        deleted: false,
        ownPost: true,
        canDeleteUntil: now + 180 * 60 * 1000,
        pending: true,
      };
      qc.setQueryData<ThreadData>(qk.thread(threadId), (d) =>
        d
          ? {
              ...d,
              thread: { ...d.thread, replyCount: d.thread.replyCount + 1 },
              posts: [...d.posts, optimistic],
            }
          : d,
      );
      return { prev, tempId, localPreview };
    },

    onError: (_e, _fd, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.thread(threadId), ctx.prev);
      if (ctx?.localPreview) URL.revokeObjectURL(ctx.localPreview);
      toast.error("Post failed. Try again.");
    },

    onSuccess: (real, _fd, ctx) => {
      if (ctx?.localPreview) URL.revokeObjectURL(ctx.localPreview);
      qc.setQueryData<ThreadData>(qk.thread(threadId), (d) =>
        d ? { ...d, posts: d.posts.map((p) => (p.id === ctx?.tempId ? real : p)) } : d,
      );
      setBody("");
      setName("");
      setSage(false);
      setImageFile(null);
      setPreviewUrl(null);
      if (fileRef.current) fileRef.current.value = "";
    },

    onSettled: () => qc.invalidateQueries({ queryKey: qk.thread(threadId) }),
  });

  if (locked) {
    return (
      <p className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-muted)]">
        This thread is locked.
      </p>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending || !body.trim()) return;
    const fd = new FormData();
    fd.append("body", body);
    if (name) fd.append("name", name);
    fd.append("sage", String(sage));
    if (imageFile) fd.append("image", imageFile);
    mutate(fd);
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
          className="min-w-48 flex-1"
        />
        <label className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-muted)]">
          <input type="checkbox" checked={sage} onChange={(e) => setSage(e.target.checked)} />
          sage
        </label>
      </div>

      {previewUrl && (
        <div className="relative mb-2 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="preview"
            className="max-h-40 max-w-full rounded-[calc(var(--radius)-2px)] object-contain"
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
        placeholder="Reply… (>greentext, >>postid, [s]spoiler[/s])"
        rows={3}
      />

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
        <Button type="submit" disabled={isPending || !body.trim()}>
          {isPending ? "Posting…" : "Reply"}
        </Button>
      </div>
    </form>
  );
}
