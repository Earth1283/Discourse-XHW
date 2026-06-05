"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";

type ToastItem = { id: number; msg: string; level: "error" | "success" | "info" };
let _id = 0;

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast._subscribe((msg, level) => {
      const id = _id++;
      setItems((t) => [...t, { id, msg, level }]);
      setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 4000);
    });
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "rounded-[var(--radius)] border px-4 py-2.5 font-mono text-sm shadow-lg",
            item.level === "error" &&
              "border-[var(--color-danger)]/50 bg-[var(--color-surface)] text-[var(--color-danger)]",
            item.level === "success" &&
              "border-[var(--color-accent)]/50 bg-[var(--color-surface)] text-[var(--color-accent)]",
            item.level === "info" &&
              "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]",
          )}
        >
          {item.msg}
        </div>
      ))}
    </div>
  );
}
