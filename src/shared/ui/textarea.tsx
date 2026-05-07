import * as React from "react";
import { cn } from "@/shared/lib/cn";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-20 w-full rounded-lg border border-[var(--lc-border)] bg-[var(--lc-input-strong)] px-3 py-2 text-sm text-[var(--lc-text-strong)] outline-none transition-colors placeholder:text-[var(--lc-subtle)] focus:border-[var(--lc-border-strong)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
