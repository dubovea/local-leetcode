import { ChevronDown, List, Moon, Play, Send, Sun } from "lucide-react";
import { Button } from "@/shared/ui/button";

type AppTheme = "dark" | "light";

export function TopBar({
  onOpenProblemList,
  onPlay,
  onSubmit,
  onThemeToggle,
  running,
  theme,
}: {
  onOpenProblemList: () => void;
  onPlay: () => void;
  onSubmit: () => void;
  onThemeToggle: () => void;
  running: boolean;
  theme: AppTheme;
}) {
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const themeTitle = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--lc-border)] bg-[var(--lc-topbar)] px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#f5b935] text-sm font-black text-black">
          L
        </div>
        <button
          className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-[15px] font-semibold text-[var(--lc-text-strong)] transition-colors hover:bg-[var(--lc-hover)]"
          type="button"
          onClick={onOpenProblemList}
        >
          <List className="h-4 w-4 shrink-0 text-[var(--lc-muted)]" />
          <span className="truncate">Problem List</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--lc-muted)]" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Button className="min-w-24" disabled={running} onClick={onPlay}>
          <Play className="h-4 w-4" />
          Play
        </Button>
        <Button className="min-w-24" disabled={running} onClick={onSubmit} variant="success">
          <Send className="h-4 w-4" />
          Submit
        </Button>
      </div>

      <div className="flex justify-end">
        <Button
          aria-label={themeTitle}
          size="icon"
          title={themeTitle}
          variant="ghost"
          onClick={onThemeToggle}
        >
          <ThemeIcon className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
