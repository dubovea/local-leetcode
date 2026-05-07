import { cn } from "@/shared/lib/cn";
import type { RunStatus } from "@/entities/problem/model/types";

const labels: Record<RunStatus, string> = {
  idle: "Not run",
  running: "Running",
  accepted: "Accepted",
  "wrong-answer": "Wrong Answer",
  "runtime-error": "Runtime Error",
  timeout: "Time Limit Exceeded",
};

const classes: Record<RunStatus, string> = {
  idle: "text-[var(--lc-muted)]",
  running: "text-[var(--lc-warning)]",
  accepted: "text-[var(--lc-success)]",
  "wrong-answer": "text-[var(--lc-danger-strong)]",
  "runtime-error": "text-[var(--lc-danger-strong)]",
  timeout: "text-[var(--lc-danger-strong)]",
};

export function StatusText({ status, className }: { status: RunStatus; className?: string }) {
  return <span className={cn("font-semibold", classes[status], className)}>{labels[status]}</span>;
}
