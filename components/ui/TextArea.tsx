"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Auto-growing textarea. */
export function TextArea({ className, value, onChange, ...rest }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      className={cn(
        "w-full resize-none rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)]",
        "px-3 py-2 text-sm leading-relaxed text-[var(--color-text)] placeholder:text-[var(--color-muted)]",
        "focus:border-[var(--color-accent)] focus:outline-none",
        className,
      )}
      {...rest}
    />
  );
}
