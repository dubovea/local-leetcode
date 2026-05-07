import type { Difficulty } from "@/entities/problem/model/types";
import { cn } from "@/shared/lib/cn";

const classes: Record<Difficulty, string> = {
  Easy: "text-[var(--lc-easy)]",
  Medium: "text-[var(--lc-medium)]",
  Hard: "text-[var(--lc-hard)]",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <span className={cn("text-xs font-medium", classes[difficulty])}>{difficulty}</span>;
}
