# 07 — Optimistic UI (TanStack Query)

Goal: posting, replying, and deleting feel instant. The UI mutates immediately, then reconciles with the server, and **rolls back** on failure with a toast.

## Query keys

```ts
export const qk = {
  boards: ["boards"] as const,
  threads: (board: string) => ["threads", board] as const,
  thread: (id: string) => ["thread", id] as const,
};
```

## Fetch helper

```ts
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Request failed");
  return json.data as T;
}
```

## Optimistic reply

```tsx
function useCreateReply(threadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) =>
      api<PostDTO>(`/api/threads/${threadId}/posts`, { method: "POST", body: form }),

    onMutate: async (form) => {
      await qc.cancelQueries({ queryKey: qk.thread(threadId) });
      const prev = qc.getQueryData<ThreadData>(qk.thread(threadId));

      const tempId = `temp-${crypto.randomUUID()}`;
      const optimistic: PostDTO = {
        id: tempId, threadId, isOp: false,
        name: (form.get("name") as string) || "Anonymous",
        tripcode: null,
        body: form.get("body") as string,
        imagePath: null, thumbPath: null,
        createdAt: Date.now(),
        deleted: false, ownPost: true,
        canDeleteUntil: Date.now() + 180 * 60 * 1000,
        pending: true,                         // UI: dim + "posting…"
      } as PostDTO & { pending: boolean };

      qc.setQueryData<ThreadData>(qk.thread(threadId), (d) =>
        d ? { ...d, posts: [...d.posts, optimistic] } : d);
      return { prev, tempId };
    },

    onError: (_e, _form, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.thread(threadId), ctx.prev);   // rollback
      toast.error("Post failed. Try again.");
    },

    onSuccess: (real, _form, ctx) => {
      qc.setQueryData<ThreadData>(qk.thread(threadId), (d) =>
        d ? { ...d, posts: d.posts.map((p) => (p.id === ctx?.tempId ? real : p)) } : d);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.thread(threadId) });          // reconcile bump/order
    },
  });
}
```

UI: render `pending` posts at reduced opacity with a small "posting…" mono tag; on success it swaps to the real `#postId` seamlessly.

## Optimistic new thread

Same pattern against `qk.threads(board)`: prepend an optimistic `ThreadCard` (temp id, `replyCount: 0`, `bumpedAt: now`). On success, replace temp card with the real thread and `router.push(/b/${board}/${realId})`. On error, remove the temp card + toast.

## Optimistic delete

```tsx
function useDeletePost(threadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => api(`/api/posts/${postId}`, { method: "DELETE" }),
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: qk.thread(threadId) });
      const prev = qc.getQueryData<ThreadData>(qk.thread(threadId));
      qc.setQueryData<ThreadData>(qk.thread(threadId), (d) =>
        d ? { ...d, posts: d.posts.map((p) =>
              p.id === postId ? { ...p, deleted: true } : p) } : d);
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.thread(threadId), ctx.prev);
      toast.error("Couldn't delete.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.thread(threadId) }),
  });
}
```

## Rules for safe optimism

- **Always** `cancelQueries` before writing, snapshot `prev`, restore on error.
- Temp IDs are clearly namespaced (`temp-…`) so the delete/quote UI can disable actions on not-yet-confirmed posts.
- `onSettled` invalidation is the source of truth — optimism is a UX bridge, never the final state.
- Don't optimistically apply server-derived fields you can't compute (real `#id`, server `createdAt`, thumbnail path). Show placeholders, let `onSuccess` fill them.
- Image uploads: show the **local object URL** as the optimistic thumbnail; swap to the server `thumbPath` on success; `URL.revokeObjectURL` after.

## Exit criteria
- Submitting a reply shows it instantly; killing the network rolls it back with a toast.
- Deleting within the window flips to `[deleted]` instantly and survives refresh.
- No duplicate posts after `onSuccess` swap + `onSettled` refetch.
