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
  idle: "text-[#a8a8a8]",
  running: "text-[#ffc01e]",
  accepted: "text-[#2db55d]",
  "wrong-answer": "text-[#ff5555]",
  "runtime-error": "text-[#ff5555]",
  timeout: "text-[#ff5555]",
};

export function StatusText({ status, className }: { status: RunStatus; className?: string }) {
  return <span className={cn("font-semibold", classes[status], className)}>{labels[status]}</span>;
}
