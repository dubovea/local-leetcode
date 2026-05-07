import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ListFilter,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { Problem, ProblemListItem, ProblemsBackup } from "@/entities/problem/model/types";
import { DifficultyBadge } from "@/shared/ui/DifficultyBadge";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible";
import { Input } from "@/shared/ui/input";
import { ImportProblemsButton } from "@/features/import-problems/ui/ImportProblemsButton";
import { CreateManualProblemForm } from "@/features/manual-problem/ui/CreateManualProblemForm";
import { BackupButtons } from "@/features/backup-problems/ui/BackupButtons";

type StatusFilter = "all" | "solved" | "unsolved";

const statusFilterTitle: Record<StatusFilter, string> = {
  all: "Show all problems",
  solved: "Show solved problems",
  unsolved: "Show unsolved problems",
};

function Section({
  title,
  count,
  open,
  children,
  onOpenChange,
}: {
  title: string;
  count: number;
  open: boolean;
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
}) {
  const ChevronIcon = open ? ChevronDown : ChevronRight;

  return (
    <Collapsible className="mb-4" open={open} onOpenChange={onOpenChange}>
      <div className="sticky top-0 z-10 flex items-center justify-between bg-[#151515] px-2 py-2 text-xs font-semibold uppercase tracking-wide text-[#8f8f8f]">
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-1 rounded-md px-1 py-1 text-left transition-colors hover:bg-[#222]">
          <ChevronIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{title}</span>
        </CollapsibleTrigger>
        <span className="ml-2 rounded-full bg-[#222] px-2 py-0.5 text-[11px] text-[#9f9f9f]">{count}</span>
      </div>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}

function FilterButton({
  active,
  title,
  children,
  onClick,
}: {
  active: boolean;
  title: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      aria-label={title}
      aria-pressed={active}
      className={cn(active ? "border-[#4d4d4d] bg-[#333] text-[#f1f1f1]" : "")}
      size="icon"
      title={title}
      variant={active ? "secondary" : "ghost"}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function ProblemRow({
  item,
  activeProblemId,
  onSelect,
}: {
  item: ProblemListItem;
  activeProblemId: string;
  onSelect: (problemId: string) => void;
}) {
  const StatusIcon = item.solved ? CheckCircle2 : Circle;
  const active = item.id === activeProblemId;

  return (
    <button
      className={cn(
        "grid w-full grid-cols-[26px_1fr_auto] items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
        active ? "bg-[#2b2b2b]" : "hover:bg-[#242424]",
      )}
      type="button"
      onClick={() => onSelect(item.id)}
    >
      <StatusIcon className={cn("mx-auto h-4 w-4", item.solved ? "text-[#2db55d]" : "text-[#8b8b8b]")} />
      <span className="truncate font-medium text-[#e0e0e0]">
        {item.number}. {item.title}
      </span>
      <DifficultyBadge difficulty={item.difficulty} />
    </button>
  );
}

function applyStatusFilter(items: ProblemListItem[], statusFilter: StatusFilter) {
  if (statusFilter === "solved") {
    return items.filter((item) => item.solved);
  }

  if (statusFilter === "unsolved") {
    return items.filter((item) => !item.solved);
  }

  return items;
}

export function ProblemListDrawer({
  open,
  problemIndex,
  activeProblemId,
  onClose,
  onSelect,
  onCreateManual,
  onImportProblems,
  onResetProblems,
  onExportBackup,
  onImportBackup,
}: {
  open: boolean;
  problemIndex: ProblemListItem[];
  activeProblemId: string;
  onClose: () => void;
  onSelect: (problemId: string) => void;
  onCreateManual: (problem: Problem) => void;
  onImportProblems: (problems: Problem[]) => void;
  onResetProblems: () => void;
  onExportBackup: () => Promise<ProblemsBackup>;
  onImportBackup: (backup: ProblemsBackup | Problem[]) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [creatingManual, setCreatingManual] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [leetcodeOpen, setLeetcodeOpen] = useState(true);
  const [manualOpen, setManualOpen] = useState(true);

  const solvedCount = useMemo(() => problemIndex.filter((problem) => problem.solved).length, [problemIndex]);
  const nextManualNumber = useMemo(() => {
    const manualNumbers = problemIndex.filter((problem) => problem.source === "manual").map((problem) => problem.number);

    return Math.max(0, ...manualNumbers) + 1;
  }, [problemIndex]);

  const filteredIndex = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const queryResult = normalizedQuery
      ? problemIndex.filter((item) => {
          return (
            item.title.toLowerCase().includes(normalizedQuery) ||
            item.slug.toLowerCase().includes(normalizedQuery) ||
            String(item.number).includes(normalizedQuery)
          );
        })
      : problemIndex;

    const statusResult = applyStatusFilter(queryResult, statusFilter);

    return {
      leetcode: statusResult.filter((item) => item.source !== "manual"),
      manual: statusResult.filter((item) => item.source === "manual"),
    };
  }, [problemIndex, query, statusFilter]);

  function resetProblems() {
    const confirmed = window.confirm("Delete all imported and manual problems? The default manual Group Anagrams task will remain.");

    if (confirmed) {
      setCreatingManual(false);
      setImportStatus("");
      onResetProblems();
    }
  }

  return (
    <div className={cn("fixed inset-0 z-50 transition", open ? "visible" : "invisible")}>
      <div
        className={cn("absolute inset-0 bg-black/60 transition-opacity", open ? "opacity-100" : "opacity-0")}
        onClick={onClose}
      />

      <aside
        className={cn(
          "absolute left-0 top-0 flex h-full w-[410px] flex-col border-r border-[#333] bg-[#151515] shadow-2xl transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-[#2a2a2a] px-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[#f1f1f1]">Problem List</h2>
            <span className="rounded-full bg-[#222] px-2 py-0.5 text-xs text-[#9f9f9f]">
              {solvedCount}/{problemIndex.length} Solved
            </span>
          </div>
          <Button aria-label="Close problem list" size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="border-b border-[#2a2a2a] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Button className="flex-1" variant="secondary" onClick={() => setCreatingManual(true)}>
              <Plus className="h-4 w-4" />
              Manual problem
            </Button>
            <ImportProblemsButton onImport={onImportProblems} onStatusChange={setImportStatus} />
            <Button
              aria-label="Delete all problems"
              size="icon"
              title="Delete all problems"
              variant="destructive"
              onClick={resetProblems}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <BackupButtons onExport={onExportBackup} onImport={onImportBackup} onStatusChange={setImportStatus} />

          {importStatus ? <div className="mt-3 mb-3 text-xs text-[#8f8f8f]">{importStatus}</div> : null}

          {creatingManual ? (
            <div className="mb-3">
              <CreateManualProblemForm
                nextNumber={nextManualNumber}
                onCancel={() => setCreatingManual(false)}
                onCreate={(problem) => {
                  onCreateManual(problem);
                  setCreatingManual(false);
                }}
              />
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777]" />
              <Input
                className="rounded-full pl-9"
                placeholder="Search questions"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="flex shrink-0 items-center rounded-lg border border-[#2a2a2a] bg-[#1b1b1b] p-0.5">
              <FilterButton active={statusFilter === "all"} title={statusFilterTitle.all} onClick={() => setStatusFilter("all")}>
                <ListFilter className="h-4 w-4" />
              </FilterButton>
              <FilterButton
                active={statusFilter === "unsolved"}
                title={statusFilterTitle.unsolved}
                onClick={() => setStatusFilter("unsolved")}
              >
                <Circle className="h-4 w-4" />
              </FilterButton>
              <FilterButton
                active={statusFilter === "solved"}
                title={statusFilterTitle.solved}
                onClick={() => setStatusFilter("solved")}
              >
                <CheckCircle2 className="h-4 w-4" />
              </FilterButton>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          <Section count={filteredIndex.leetcode.length} open={leetcodeOpen} title="LeetCode problems" onOpenChange={setLeetcodeOpen}>
            {filteredIndex.leetcode.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[#777]">Import neenza JSON to add LeetCode problems.</div>
            ) : (
              filteredIndex.leetcode.map((item) => (
                <ProblemRow key={item.id} activeProblemId={activeProblemId} item={item} onSelect={onSelect} />
              ))
            )}
          </Section>

          <Section count={filteredIndex.manual.length} open={manualOpen} title="Manual problems" onOpenChange={setManualOpen}>
            {filteredIndex.manual.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[#777]">Manual problems will appear here.</div>
            ) : (
              filteredIndex.manual.map((item) => (
                <ProblemRow key={item.id} activeProblemId={activeProblemId} item={item} onSelect={onSelect} />
              ))
            )}
          </Section>
        </div>
      </aside>
    </div>
  );
}
