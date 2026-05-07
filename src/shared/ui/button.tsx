import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type ButtonVariant = "default" | "secondary" | "ghost" | "destructive" | "success";
type ButtonSize = "default" | "sm" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  default:
    "border border-[var(--lc-button-border)] bg-[var(--lc-button-bg)] text-[var(--lc-text-strong)] hover:bg-[var(--lc-button-hover)]",
  secondary:
    "border border-[var(--lc-secondary-border)] bg-[var(--lc-secondary-bg)] text-[var(--lc-text-strong)] hover:bg-[var(--lc-hover-strong)]",
  ghost:
    "bg-transparent text-[var(--lc-muted)] hover:bg-[var(--lc-hover)] hover:text-[var(--lc-text-strong)]",
  destructive:
    "border border-[var(--lc-danger-border)] bg-[var(--lc-danger-bg)] text-[var(--lc-danger-text)] hover:bg-[var(--lc-danger-soft)]",
  success:
    "border border-[var(--lc-success)] bg-[var(--lc-success)] text-white hover:bg-[var(--lc-success-hover)]",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-8 px-3",
  sm: "h-7 px-2 text-xs",
  icon: "h-9 w-9 p-0",
};

export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lc-border-strong)] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
