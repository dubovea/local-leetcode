import { Button } from "@/shared/ui/button";

export function TopBar({
  onOpenProblemList,
  onRun,
  onSubmit,
  running,
}: {
  onOpenProblemList: () => void;
  onRun: () => void;
  onSubmit: () => void;
  running: boolean;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#242424] bg-[#0f0f0f] px-4">
      <div className="flex items-center gap-3">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-[#f5b935] text-sm font-black text-black">
          L
        </div>
        <button
          className="flex items-center gap-2 rounded px-2 py-1 text-[15px] font-semibold text-[#f1f1f1] hover:bg-[#242424]"
          type="button"
          onClick={onOpenProblemList}
        >
          Problem List
          <span className="text-[#9a9a9a]">›</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Button className="min-w-20" disabled={running} onClick={onRun}>
          ▶ Run
        </Button>
        <Button className="min-w-24" disabled={running} onClick={onSubmit} variant="success">
          Submit
        </Button>
      </div>

      <div className="flex items-center gap-3 text-sm text-[#8f8f8f]">
        <span>⌘</span>
        <span>⚙</span>
        <span className="rounded bg-[#2b2415] px-3 py-1 text-[#f0b43a]">Premium</span>
      </div>
    </header>
  );
}
