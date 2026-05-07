import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, Circle, Plus, Search, Trash2, X } from "lucide-react";
import type { Problem, ProblemListItem } from "@/entities/problem/model/types";
import { DifficultyBadge } from "@/shared/ui/DifficultyBadge";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ImportProblemsButton } from "@/features/import-problems/ui/ImportProblemsButton";
import { CreateManualProblemForm } from "@/features/manual-problem/ui/CreateManualProblemForm";

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="mb-4">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-[#151515] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#8f8f8f]">
        <span>{title}</span>
        <span>{count}</span>
      </div>
      <div>{children}</div>
    </section>
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

export function ProblemListDrawer({
  open,
  problemIndex,
  activeProblemId,
  onClose,
  onSelect,
  onCreateManual,
  onImportProblems,
  onResetProblems,
}: {
  open: boolean;
  problemIndex: ProblemListItem[];
  activeProblemId: string;
  onClose: () => void;
  onSelect: (problemId: string) => void;
  onCreateManual: (problem: Problem) => void;
  onImportProblems: (problems: Problem[]) => void;
  onResetProblems: () => void;
}) {
  const [query, setQuery] = useState("");
  const [creatingManual, setCreatingManual] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const solvedCount = useMemo(() => problemIndex.filter((problem) => problem.solved).length, [problemIndex]);
  const nextManualNumber = useMemo(() => {
    const manualNumbers = problemIndex.filter((problem) => problem.source === "manual").map((problem) => problem.number);

    return Math.max(0, ...manualNumbers) + 1;
  }, [problemIndex]);

  const filteredIndex = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = normalizedQuery
      ? problemIndex.filter((item) => {
          return (
            item.title.toLowerCase().includes(normalizedQuery) ||
            item.slug.toLowerCase().includes(normalizedQuery) ||
            String(item.number).includes(normalizedQuery)
          );
        })
      : problemIndex;

    return {
      leetcode: result.filter((item) => item.source !== "manual"),
      manual: result.filter((item) => item.source === "manual"),
    };
  }, [problemIndex, query]);

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

          {importStatus ? <div className="mb-3 text-xs text-[#8f8f8f]">{importStatus}</div> : null}

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

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777]" />
            <Input
              className="rounded-full pl-9"
              placeholder="Search questions"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          <Section count={filteredIndex.leetcode.length} title="LeetCode problems">
            {filteredIndex.leetcode.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[#777]">Import neenza JSON to add LeetCode problems.</div>
            ) : (
              filteredIndex.leetcode.map((item) => (
                <ProblemRow key={item.id} activeProblemId={activeProblemId} item={item} onSelect={onSelect} />
              ))
            )}
          </Section>

          <Section count={filteredIndex.manual.length} title="Manual problems">
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
