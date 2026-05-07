import type { InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export function Input({ className, type = "text", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-md border border-[#333] bg-[#262626] px-3 py-1 text-sm text-[#f1f1f1] shadow-sm outline-none transition-colors placeholder:text-[#777] focus-visible:border-[#555] focus-visible:ring-2 focus-visible:ring-[#555]/40 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
