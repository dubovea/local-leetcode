import type { InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export function Input({
  className,
  type = "text",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-md border border-[var(--lc-border)] bg-[var(--lc-input)] px-3 py-1 text-sm text-[var(--lc-text-strong)] shadow-sm outline-none transition-colors placeholder:text-[var(--lc-subtle)] focus-visible:border-[var(--lc-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--lc-border-strong)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
