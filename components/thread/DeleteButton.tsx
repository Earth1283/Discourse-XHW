"use client";

import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { qk } from "@/lib/query/keys";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { ThreadData } from "@/lib/types";
import { useI18n } from "@/lib/i18n/client";

export function DeleteButton({ postId, threadId }: { postId: string; threadId: string }) {
  const qc = useQueryClient();
  const { t } = useI18n();

  const { mutate, isPending } = useMutation({
    mutationFn: () => apiFetch(`/api/posts/${postId}`, { method: "DELETE" }),

    onMutate: async () => {
      await qc.cancelQueries({ queryKey: qk.thread(threadId) });
      const prev = qc.getQueryData<ThreadData>(qk.thread(threadId));
      qc.setQueryData<ThreadData>(qk.thread(threadId), (d) =>
        d
          ? {
              ...d,
              posts: d.posts.map((p) =>
                p.id === postId ? { ...p, deleted: true, canDeleteUntil: null } : p,
              ),
            }
          : d,
      );
      return { prev };
    },

    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.thread(threadId), ctx.prev);
      toast.error(t("alert.delete_failed"));
    },

    onSettled: () => qc.invalidateQueries({ queryKey: qk.thread(threadId) }),
  });

  return (
    <button
      onClick={() => {
        if (!confirm(t("alert.delete_confirm"))) return;
        mutate();
      }}
      disabled={isPending}
      title={t("post.delete_title")}
      data-testid="delete-btn"
      className="text-[var(--color-muted)] hover:text-[var(--color-danger)] disabled:opacity-40"
    >
      <Trash2 size={13} />
    </button>
  );
}
