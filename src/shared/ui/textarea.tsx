import * as React from "react";
import { cn } from "@/shared/lib/cn";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-20 w-full rounded-lg border border-[#303030] bg-[#2b2b2b] px-3 py-2 text-sm text-[#f1f1f1] outline-none transition-colors placeholder:text-[#777] focus:border-[#555] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
