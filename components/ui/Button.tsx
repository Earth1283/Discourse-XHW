import { cn } from "@/lib/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

export function Button({ variant = "primary", className, ...rest }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius)] px-3 py-1.5 text-sm font-medium",
        "transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
        variant === "primary" &&
          "bg-[var(--color-accent)] text-[var(--color-accent-ink)] hover:brightness-110",
        variant === "ghost" &&
          "bg-transparent text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
        variant === "danger" &&
          "bg-transparent text-[var(--color-danger)] hover:bg-[color-mix(in_oklch,var(--color-danger)_12%,transparent)]",
        className,
      )}
      {...rest}
    />
  );
}
