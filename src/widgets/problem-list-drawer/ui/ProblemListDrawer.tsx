import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Gauge,
  ListFilter,
  Plus,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import type {
  Difficulty,
  Problem,
  ProblemListItem,
  ProblemsBackup,
} from "@/entities/problem/model/types";
import { DifficultyBadge } from "@/shared/ui/DifficultyBadge";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible";
import { Input } from "@/shared/ui/input";
import { ImportProblemsButton } from "@/features/import-problems/ui/ImportProblemsButton";
import { CreateManualProblemForm } from "@/features/manual-problem/ui/CreateManualProblemForm";
import { BackupButtons } from "@/features/backup-problems/ui/BackupButtons";

type StatusFilter = "all" | "solved" | "unsolved";
type DifficultyFilter = "all" | Difficulty;

const difficultyFilters: Difficulty[] = ["Easy", "Medium", "Hard"];

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
      <div className="sticky top-0 z-10 flex items-center justify-between bg-[var(--lc-page)] px-2 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--lc-muted)]">
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-1 rounded-md px-1 py-1 text-left transition-colors hover:bg-[var(--lc-hover)]">
          <ChevronIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{title}</span>
        </CollapsibleTrigger>
        <span className="ml-2 rounded-full bg-[var(--lc-hover)] px-2 py-0.5 text-[11px] text-[var(--lc-muted)]">
          {count}
        </span>
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
      className={cn(
        active
          ? "border-[var(--lc-border-strong)] bg-[var(--lc-active)] text-[var(--lc-text-strong)]"
          : "",
      )}
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
  onDelete,
}: {
  item: ProblemListItem;
  activeProblemId: string;
  onSelect: (problemId: string) => void;
  onDelete: (item: ProblemListItem) => void;
}) {
  const StatusIcon = item.solved ? CheckCircle2 : Circle;
  const active = item.id === activeProblemId;

  return (
    <div
      className={cn(
        "group grid w-full grid-cols-[minmax(0,1fr)_32px] items-center rounded-lg text-sm transition-colors",
        active ? "bg-[var(--lc-active)]" : "hover:bg-[var(--lc-hover)]",
      )}
    >
      <button
        className="grid min-w-0 grid-cols-[26px_1fr_auto] items-center gap-2 px-3 py-2.5 text-left"
        type="button"
        onClick={() => onSelect(item.id)}
      >
        <StatusIcon
          className={cn(
            "mx-auto h-4 w-4",
            item.solved ? "text-[var(--lc-success)]" : "text-[var(--lc-subtle)]",
          )}
        />
        <span className="truncate font-medium text-[var(--lc-text-strong)]">
          {item.number}. {item.title}
        </span>
        <DifficultyBadge difficulty={item.difficulty} />
      </button>
      <Button
        aria-label={`Delete ${item.title}`}
        className="mr-1 h-7 w-7 border border-[var(--lc-danger-border)] bg-[var(--lc-danger-bg)] text-[var(--lc-danger-text)] opacity-75 hover:bg-[var(--lc-danger-soft)] hover:text-[var(--lc-danger-text)] hover:opacity-100 focus-visible:opacity-100"
        size="icon"
        title={`Delete ${item.title}`}
        variant="ghost"
        onClick={() => onDelete(item)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
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

function applyTopicFilter(items: ProblemListItem[], selectedTopic: string) {
  if (selectedTopic === "all") {
    return items;
  }

  return items.filter((item) => (item.topics ?? []).includes(selectedTopic));
}

function applyDifficultyFilter(items: ProblemListItem[], difficultyFilter: DifficultyFilter) {
  if (difficultyFilter === "all") {
    return items;
  }

  return items.filter((item) => item.difficulty === difficultyFilter);
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
  onDeleteProblem,
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
  onDeleteProblem: (problemId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [creatingManual, setCreatingManual] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [catalogOpen, setCatalogOpen] = useState(true);
  const [manualOpen, setManualOpen] = useState(true);

  const topics = useMemo(
    () =>
      Array.from(new Set(problemIndex.flatMap((problem) => problem.topics ?? []))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [problemIndex],
  );
  const solvedCount = useMemo(
    () => problemIndex.filter((problem) => problem.solved).length,
    [problemIndex],
  );
  const nextManualNumber = useMemo(() => {
    const manualNumbers = problemIndex
      .filter((problem) => problem.source === "manual")
      .map((problem) => problem.number);

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
    const difficultyResult = applyDifficultyFilter(statusResult, difficultyFilter);
    const topicResult = applyTopicFilter(difficultyResult, selectedTopic);

    return {
      catalog: topicResult.filter((item) => item.source !== "manual"),
      manual: topicResult.filter((item) => item.source === "manual"),
    };
  }, [difficultyFilter, problemIndex, query, selectedTopic, statusFilter]);

  function resetProblems() {
    const confirmed = window.confirm(
      "Delete all imported and manual problems? The default manual Group Anagrams task will remain.",
    );

    if (confirmed) {
      setCreatingManual(false);
      setImportStatus("");
      onResetProblems();
    }
  }

  function deleteProblem(item: ProblemListItem) {
    const confirmed = window.confirm(
      `Delete "${item.title}"? This removes its code, notes, tests, and submissions.`,
    );

    if (confirmed) {
      setCreatingManual(false);
      setImportStatus("");
      onDeleteProblem(item.id);
    }
  }

  return (
    <div className={cn("fixed inset-0 z-50 transition", open ? "visible" : "invisible")}>
      <div
        className={cn(
          "absolute inset-0 bg-[var(--lc-backdrop)] transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "absolute left-0 top-0 flex h-full w-[410px] flex-col border-r border-[var(--lc-border)] bg-[var(--lc-page)] shadow-2xl transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-[var(--lc-border)] px-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[var(--lc-text-strong)]">Задачи</h2>
            <span className="rounded-full bg-[var(--lc-hover)] px-2 py-0.5 text-xs text-[var(--lc-muted)]">
              {solvedCount}/{problemIndex.length} Solved
            </span>
          </div>
          <Button aria-label="Close problem list" size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="border-b border-[var(--lc-border)] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Button className="flex-1" variant="secondary" onClick={() => setCreatingManual(true)}>
              <Plus className="h-4 w-4" />
              Своя задача
            </Button>
            <ImportProblemsButton onImport={onImportProblems} onStatusChange={setImportStatus} />
            <Button
              aria-label="Удалить все задачи"
              size="icon"
              title="Удалить все задачи"
              variant="destructive"
              onClick={resetProblems}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <BackupButtons
            onExport={onExportBackup}
            onImport={onImportBackup}
            onStatusChange={setImportStatus}
          />

          {importStatus ? (
            <div className="mt-3 mb-3 text-xs text-[var(--lc-muted)]">{importStatus}</div>
          ) : null}

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
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lc-subtle)]" />
              <Input
                className="rounded-full pl-9"
                placeholder="Поиск задач"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="flex shrink-0 items-center rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel)] p-0.5">
              <FilterButton
                active={statusFilter === "all"}
                title={statusFilterTitle.all}
                onClick={() => setStatusFilter("all")}
              >
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

          <div className={cn("mt-3 grid gap-2", topics.length > 0 ? "grid-cols-2" : "grid-cols-1")}>
            <div className="relative flex min-w-0 items-center gap-2 rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel)] px-3">
              <Gauge className="h-4 w-4 shrink-0 text-[var(--lc-subtle)]" />
              <select
                className="h-9 min-w-0 flex-1 appearance-none bg-transparent pr-7 text-sm text-[var(--lc-text-strong)]"
                title="Filter by difficulty"
                value={difficultyFilter}
                onChange={(event) => setDifficultyFilter(event.target.value as DifficultyFilter)}
              >
                <option value="all">All difficulties</option>
                {difficultyFilters.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-[var(--lc-subtle)]" />
            </div>

            {topics.length > 0 ? (
              <div className="relative flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel)] px-3">
                <Tags className="h-4 w-4 shrink-0 text-[var(--lc-subtle)]" />
                <select
                  className="h-9 min-w-0 flex-1 appearance-none bg-transparent pr-7 text-sm text-[var(--lc-text-strong)]"
                  title="Filter by topic"
                  value={selectedTopic}
                  onChange={(event) => setSelectedTopic(event.target.value)}
                >
                  <option value="all">All topics</option>
                  {topics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-[var(--lc-subtle)]" />
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          <Section
            count={filteredIndex.catalog.length}
            open={catalogOpen}
            title="Каталог задач"
            onOpenChange={setCatalogOpen}
          >
            {filteredIndex.catalog.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[var(--lc-subtle)]">
                Импортируйте JSON, чтобы добавить задачи.
              </div>
            ) : (
              filteredIndex.catalog.map((item) => (
                <ProblemRow
                  key={item.id}
                  activeProblemId={activeProblemId}
                  item={item}
                  onSelect={onSelect}
                  onDelete={deleteProblem}
                />
              ))
            )}
          </Section>

          <Section
            count={filteredIndex.manual.length}
            open={manualOpen}
            title="Manual problems"
            onOpenChange={setManualOpen}
          >
            {filteredIndex.manual.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[var(--lc-subtle)]">
                Manual problems will appear here.
              </div>
            ) : (
              filteredIndex.manual.map((item) => (
                <ProblemRow
                  key={item.id}
                  activeProblemId={activeProblemId}
                  item={item}
                  onSelect={onSelect}
                  onDelete={deleteProblem}
                />
              ))
            )}
          </Section>
        </div>
      </aside>
    </div>
  );
}
