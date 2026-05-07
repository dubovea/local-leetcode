import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type ButtonVariant = "default" | "secondary" | "ghost" | "destructive" | "success";
type ButtonSize = "default" | "sm" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  default: "border border-[#3a3a3a] bg-[#2b2b2b] text-[#f1f1f1] hover:bg-[#3a3a3a]",
  secondary: "border border-[#333] bg-[#262626] text-[#e8e8e8] hover:bg-[#333]",
  ghost: "bg-transparent text-[#bdbdbd] hover:bg-[#2a2a2a] hover:text-[#f1f1f1]",
  destructive: "border border-[#5a3333] bg-[#3b2525] text-[#ff8b8b] hover:bg-[#4a2b2b]",
  success: "border border-[#2db55d] bg-[#2db55d] text-white hover:bg-[#28a653]",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-8 px-3",
  sm: "h-7 px-2 text-xs",
  icon: "h-9 w-9 p-0",
};

export function Button({ className, variant = "default", size = "default", type = "button", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#555] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
