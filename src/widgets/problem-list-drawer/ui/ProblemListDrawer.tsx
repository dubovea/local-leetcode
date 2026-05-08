import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useInView } from "react-intersection-observer";
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
} from "lucide-react";

import type {
  Difficulty,
  Problem,
  ProblemListItem,
  ProblemsBackup,
} from "@/entities/problem/model/types";

import { DifficultyBadge } from "@/shared/ui/DifficultyBadge";
import { cn } from "@/shared/lib/utils";

import { Button } from "@/shared/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";

import { ImportProblemsButton } from "@/features/import-problems/ui/ImportProblemsButton";
import { CreateManualProblemForm } from "@/features/manual-problem/ui/CreateManualProblemForm";
import { BackupButtons } from "@/features/backup-problems/ui/BackupButtons";

type StatusFilter = "all" | "solved" | "unsolved";
type DifficultyFilter = "all" | Difficulty;

type FilterOption<T extends string = string> = {
  value: T;
  label: string;
};

const PAGE_SIZE = 35;

const difficultyOptions: FilterOption<DifficultyFilter>[] = [
  { value: "all", label: "Любая сложность" },
  { value: "Easy", label: "Лёгкая" },
  { value: "Medium", label: "Средняя" },
  { value: "Hard", label: "Сложная" },
];

const statusFilterTitle: Record<StatusFilter, string> = {
  all: "Показать все задачи",
  solved: "Показать решённые задачи",
  unsolved: "Показать нерешённые задачи",
};

function getScrollAreaViewport(root: HTMLDivElement | null) {
  return root?.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]") ?? null;
}

function usePagedItems<T>(items: T[], pageSize = PAGE_SIZE) {
  const [limit, setLimit] = useState(pageSize);

  useEffect(() => {
    setLimit(pageSize);
  }, [items, pageSize]);

  const visibleItems = useMemo(() => {
    return items.slice(0, limit);
  }, [items, limit]);

  const hasMore = limit < items.length;

  const loadMore = useCallback(() => {
    setLimit((currentLimit) => Math.min(currentLimit + pageSize, items.length));
  }, [items.length, pageSize]);

  return {
    visibleItems,
    visibleCount: visibleItems.length,
    totalCount: items.length,
    hasMore,
    loadMore,
  };
}

function LoadMoreTrigger({
  hasMore,
  visibleCount,
  totalCount,
  root,
  onLoadMore,
}: {
  hasMore: boolean;
  visibleCount: number;
  totalCount: number;
  root: HTMLElement | null;
  onLoadMore: () => void;
}) {
  const { ref, inView } = useInView({
    root,
    rootMargin: "320px 0px",
    threshold: 0,
    skip: !hasMore,
  });

  useEffect(() => {
    if (inView && hasMore) {
      onLoadMore();
    }
  }, [inView, hasMore, onLoadMore]);

  if (!hasMore) {
    return null;
  }

  return (
    <div ref={ref} className="py-3 text-center text-xs text-(--lc-muted)">
      Показано {visibleCount} из {totalCount}. Загружаем ещё...
    </div>
  );
}

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
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className="sticky top-0 z-10 flex items-center justify-between bg-[var(--lc-page)] px-2 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--lc-muted)]">
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-1 rounded-md px-1 py-1 text-left transition-colors hover:bg-[var(--lc-hover)]">
          <ChevronIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{title}</span>
        </CollapsibleTrigger>

        <span className="ml-2 rounded-full bg-[var(--lc-hover)] px-2 py-0.5 text-[11px] text-[var(--lc-muted)]">
          {count}
        </span>
      </div>

      <CollapsibleContent>{open ? children : null}</CollapsibleContent>
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

function FilterSelect<T extends string>({
  icon,
  label,
  value,
  options,
  contentClassName,
  onValueChange,
}: {
  icon: ReactNode;
  label: string;
  value: T;
  options: FilterOption<T>[];
  contentClassName?: string;
  onValueChange: (value: T) => void;
}) {
  return (
    <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue as T)}>
      <SelectTrigger
        aria-label={label}
        className="h-9 w-full min-w-0 justify-between gap-2 overflow-hidden rounded-lg border-(--lc-border) bg-(--lc-panel) text-(--lc-text-strong)"
        title={label}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <span className="shrink-0 text-(--lc-subtle)">{icon}</span>

          <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">
            <SelectValue />
          </span>
        </span>
      </SelectTrigger>
      <SelectContent className={cn("bg-(--lc-panel-raised)", contentClassName)}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const ProblemRow = memo(function ProblemRow({
  item,
  activeProblemId,
  onSelect,
  onDelete,
}: {
  item: ProblemListItem;
  activeProblemId: string | null;
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
        aria-label={`Удалить задачу ${item.title}`}
        className="mr-1 h-7 w-7 border border-[var(--lc-danger-border)] bg-[var(--lc-danger-bg)] text-[var(--lc-danger-text)] opacity-90 hover:bg-[var(--lc-danger-soft)] hover:text-[var(--lc-danger-text)] hover:opacity-100 focus-visible:opacity-100"
        size="icon"
        title={`Удалить задачу ${item.title}`}
        variant="ghost"
        onClick={() => onDelete(item)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
});

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
  activeProblemId: string | null;
  onClose: () => void;
  onSelect: (problemId: string) => void;
  onCreateManual: (problem: Problem) => void;
  onImportProblems: (problems: Problem[]) => void;
  onResetProblems: () => void;
  onExportBackup: () => Promise<ProblemsBackup>;
  onImportBackup: (backup: ProblemsBackup | Problem[]) => Promise<void>;
  onDeleteProblem: (problemId: string) => void;
}) {
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const [creatingManual, setCreatingManual] = useState(false);
  const [importStatus, setImportStatus] = useState("");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [selectedTopic, setSelectedTopic] = useState("all");

  const [catalogOpen, setCatalogOpen] = useState(true);
  const [manualOpen, setManualOpen] = useState(true);

  const handleScrollAreaRef = useCallback((node: HTMLDivElement | null) => {
    scrollAreaRef.current = node;
    setScrollRoot(getScrollAreaViewport(node));
  }, []);

  const topics = useMemo(() => {
    return Array.from(new Set(problemIndex.flatMap((problem) => problem.topics ?? []))).sort(
      (a, b) => a.localeCompare(b),
    );
  }, [problemIndex]);

  const topicOptions = useMemo<FilterOption[]>(() => {
    return [
      { value: "all", label: "Все темы" },
      ...topics.map((topic) => ({ value: topic, label: topic })),
    ];
  }, [topics]);

  const solvedCount = useMemo(() => {
    return problemIndex.filter((problem) => problem.solved).length;
  }, [problemIndex]);

  const nextManualNumber = useMemo(() => {
    const manualNumbers = problemIndex
      .filter((problem) => problem.source === "manual")
      .map((problem) => problem.number);

    return Math.max(0, ...manualNumbers) + 1;
  }, [problemIndex]);

  const hasActiveFilters =
    deferredQuery.trim() !== "" ||
    statusFilter !== "all" ||
    difficultyFilter !== "all" ||
    selectedTopic !== "all";

  const filteredIndex = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

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
  }, [deferredQuery, difficultyFilter, problemIndex, selectedTopic, statusFilter]);

  const catalogPage = usePagedItems(filteredIndex.catalog);
  const manualPage = usePagedItems(filteredIndex.manual);

  useEffect(() => {
    scrollRoot?.scrollTo({ top: 0 });
  }, [scrollRoot, deferredQuery, statusFilter, difficultyFilter, selectedTopic]);

  const resetProblems = useCallback(() => {
    const confirmed = window.confirm(
      "Удалить все задачи? Встроенные задачи MedikCode тоже будут удалены.",
    );

    if (!confirmed) {
      return;
    }

    setCreatingManual(false);
    setImportStatus("");
    onResetProblems();
  }, [onResetProblems]);

  const deleteProblem = useCallback(
    (item: ProblemListItem) => {
      const confirmed = window.confirm(
        `Удалить "${item.title}"? Будут удалены код, заметки, тесты и история решений.`,
      );

      if (!confirmed) {
        return;
      }

      setCreatingManual(false);
      setImportStatus("");
      onDeleteProblem(item.id);
    },
    [onDeleteProblem],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        onClose();
      }
    },
    [onClose],
  );

  const catalogEmptyText = hasActiveFilters
    ? "Ничего не найдено по выбранным фильтрам."
    : "Импортируйте JSON, чтобы добавить задачи.";

  const manualEmptyText = hasActiveFilters
    ? "Своих задач по выбранным фильтрам нет."
    : "Свои задачи появятся здесь.";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="left"
        className="flex h-full w-[410px] max-w-[calc(100vw-24px)] flex-col border-r border-[var(--lc-border)] bg-[var(--lc-page)] p-0 shadow-2xl sm:max-w-none"
      >
        <SheetHeader className="flex h-14 shrink-0 flex-row items-center justify-between border-b border-[var(--lc-border)] px-4 pr-12">
          <div className="flex min-w-0 items-center gap-3">
            <SheetTitle className="text-lg font-semibold text-[var(--lc-text-strong)]">
              Задачи
            </SheetTitle>

            <span className="shrink-0 rounded-full bg-[var(--lc-hover)] px-2 py-0.5 text-xs text-[var(--lc-muted)]">
              {solvedCount}/{problemIndex.length} Решено
            </span>
          </div>

          <SheetDescription className="sr-only">
            Список задач, фильтры, импорт, экспорт и создание своих задач.
          </SheetDescription>
        </SheetHeader>

        <div className="shrink-0 border-b border-[var(--lc-border)] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Button className="flex-1" variant="secondary" onClick={() => setCreatingManual(true)}>
              <Plus className="h-4 w-4" />
              Своя задача
            </Button>

            <ImportProblemsButton onImport={onImportProblems} onStatusChange={setImportStatus} />

            <BackupButtons
              onExport={onExportBackup}
              onImport={onImportBackup}
              onReset={resetProblems}
              onStatusChange={setImportStatus}
            />
          </div>

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
            <FilterSelect
              icon={<Gauge className="h-4 w-4" />}
              label="Фильтр по сложности"
              options={difficultyOptions}
              value={difficultyFilter}
              onValueChange={setDifficultyFilter}
            />

            {topics.length > 0 ? (
              <FilterSelect
                contentClassName="min-w-64"
                icon={<Tags className="h-4 w-4" />}
                label="Фильтр по теме"
                options={topicOptions}
                value={selectedTopic}
                onValueChange={setSelectedTopic}
              />
            ) : null}
          </div>
        </div>

        <ScrollArea ref={handleScrollAreaRef} className="min-h-0 flex-1">
          <div className="p-2">
            <Section
              count={filteredIndex.catalog.length}
              open={catalogOpen}
              title="Каталог задач"
              onOpenChange={setCatalogOpen}
            >
              {filteredIndex.catalog.length === 0 ? (
                <div className="px-3 py-4 text-sm text-[var(--lc-subtle)]">{catalogEmptyText}</div>
              ) : (
                <>
                  {catalogPage.visibleItems.map((item) => (
                    <ProblemRow
                      key={item.id}
                      activeProblemId={activeProblemId}
                      item={item}
                      onSelect={onSelect}
                      onDelete={deleteProblem}
                    />
                  ))}

                  <LoadMoreTrigger
                    hasMore={catalogPage.hasMore}
                    root={scrollRoot}
                    totalCount={catalogPage.totalCount}
                    visibleCount={catalogPage.visibleCount}
                    onLoadMore={catalogPage.loadMore}
                  />
                </>
              )}
            </Section>

            <Section
              count={filteredIndex.manual.length}
              open={manualOpen}
              title="Свои задачи"
              onOpenChange={setManualOpen}
            >
              {filteredIndex.manual.length === 0 ? (
                <div className="px-3 py-4 text-sm text-[var(--lc-subtle)]">{manualEmptyText}</div>
              ) : (
                <>
                  {manualPage.visibleItems.map((item) => (
                    <ProblemRow
                      key={item.id}
                      activeProblemId={activeProblemId}
                      item={item}
                      onSelect={onSelect}
                      onDelete={deleteProblem}
                    />
                  ))}

                  <LoadMoreTrigger
                    hasMore={manualPage.hasMore}
                    root={scrollRoot}
                    totalCount={manualPage.totalCount}
                    visibleCount={manualPage.visibleCount}
                    onLoadMore={manualPage.loadMore}
                  />
                </>
              )}
            </Section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
