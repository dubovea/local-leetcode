import type { Difficulty } from "@/entities/problem/model/types";
import { cn } from "@/shared/lib/cn";

const classes: Record<Difficulty, string> = {
  Easy: "text-[#00b8a3]",
  Medium: "text-[#ffc01e]",
  Hard: "text-[#ff375f]",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <span className={cn("text-xs font-medium", classes[difficulty])}>{difficulty}</span>;
}
