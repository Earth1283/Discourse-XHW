import { cn } from "@/lib/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...rest }: Props) {
  return (
    <input
      className={cn(
        "rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5",
        "text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)]",
        "focus:border-[var(--color-accent)] focus:outline-none",
        className,
      )}
      {...rest}
    />
  );
}
