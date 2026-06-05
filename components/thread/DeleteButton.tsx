"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

export function DeleteButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (busy) return;
    if (!confirm("Delete this post? This can't be undone.")) return;
    setBusy(true);
    try {
      await apiFetch(`/api/posts/${postId}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed.");
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      title="Delete (within 180 min of posting)"
      className="text-[var(--color-muted)] hover:text-[var(--color-danger)] disabled:opacity-40"
    >
      <Trash2 size={13} />
    </button>
  );
}
