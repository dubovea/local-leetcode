import { ChevronDown, List, Moon, Play, Send, Sun } from "lucide-react";
import { Button } from "@/shared/ui/button";

type AppTheme = "dark" | "light";

export function TopBar({
  actionsDisabled = false,
  onOpenProblemList,
  onPlay,
  onSubmit,
  onThemeToggle,
  running,
  theme,
}: {
  actionsDisabled?: boolean;
  onOpenProblemList: () => void;
  onPlay: () => void;
  onSubmit: () => void;
  onThemeToggle: () => void;
  running: boolean;
  theme: AppTheme;
}) {
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const themeTitle = theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему";

  return (
    <header className="grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-(--lc-border) bg-(--lc-topbar) px-4">
      <div className="flex min-w-0 items-center gap-3 justify-start">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#f5b935] text-sm font-black text-black">
          M
        </div>
        <div className="text-[15px] font-semibold text-[var(--lc-text-strong)]">MedikCode</div>
        <Button
          className="min-w-0 px-2 text-[15px] font-semibold text-[var(--lc-text-strong)]"
          variant="ghost"
          onClick={onOpenProblemList}
        >
          <List className="h-4 w-4 shrink-0 text-[var(--lc-muted)]" />
          <span className="truncate">Задачи</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--lc-muted)]" />
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button className="min-w-24" disabled={actionsDisabled || running} onClick={onPlay}>
          <Play className="h-4 w-4" />
          Play
        </Button>
        <Button
          className="min-w-24"
          disabled={actionsDisabled || running}
          onClick={onSubmit}
          variant="success"
        >
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
