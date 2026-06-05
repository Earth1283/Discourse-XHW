"use client";

import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
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

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: { body: string; name?: string; sage: boolean }) =>
      apiFetch<PostDTO>(`/api/threads/${threadId}/posts`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: qk.thread(threadId) });
      const prev = qc.getQueryData<ThreadData>(qk.thread(threadId));

      const tempId = `temp-${crypto.randomUUID()}`;
      const now = Date.now();
      const optimistic: PostDTO = {
        id: tempId,
        threadId,
        boardId,
        isOp: false,
        name: payload.name || "Anonymous",
        tripcode: null,
        body: payload.body,
        imagePath: null,
        thumbPath: null,
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
      return { prev, tempId };
    },

    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.thread(threadId), ctx.prev);
      toast.error("Post failed. Try again.");
    },

    onSuccess: (real, _v, ctx) => {
      qc.setQueryData<ThreadData>(qk.thread(threadId), (d) =>
        d ? { ...d, posts: d.posts.map((p) => (p.id === ctx?.tempId ? real : p)) } : d,
      );
      setBody("");
      setName("");
      setSage(false);
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
    mutate({ body, name: name || undefined, sage });
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
      <TextArea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Reply… (>greentext, >>postid, [s]spoiler[/s])"
        rows={3}
      />
      <div className="mt-2 flex justify-end">
        <Button type="submit" disabled={isPending || !body.trim()}>
          {isPending ? "Posting…" : "Reply"}
        </Button>
      </div>
    </form>
  );
}
