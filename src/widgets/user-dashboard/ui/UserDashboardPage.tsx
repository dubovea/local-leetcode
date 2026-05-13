import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Cpu,
  ExternalLink,
  ListChecks,
  RotateCcw,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type {
  Difficulty,
  Problem,
  ProblemListItem,
  Submission,
} from "@/entities/problem/model/types";
import { getCodeLanguageLabel, isCodeLanguage } from "@/entities/problem/model/codeLanguages";
import { Button } from "@/shared/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui/chart";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { formatDateTime, formatMemory, formatRuntime } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";

type HistoryFilter = "all" | "solved" | "unsolved";
type SortMode = "last-submitted" | "submissions" | "title";
type ActivityMode = "solved" | "submissions";

type ProblemHistoryItem = {
  problem: Problem;
  submissions: Submission[];
  lastSubmission: Submission;
  solved: boolean;
};

type Summary = {
  acceptedSubmissions: number;
  acceptanceRate: number;
  solvedByDifficulty: Record<Difficulty, number>;
  solvedCount: number;
  solvedRate: number;
  totalSubmissions: number;
  triedCount: number;
};

type ActivityPoint = {
  date: string;
  label: string;
  solved: number;
  submissions: number;
};

const difficultyLabels: Record<Difficulty, string> = {
  Easy: "Лёгкие",
  Medium: "Средние",
  Hard: "Сложные",
};

const difficultyClasses: Record<Difficulty, string> = {
  Easy: "text-[var(--lc-easy)]",
  Medium: "text-[var(--lc-medium)]",
  Hard: "text-[var(--lc-hard)]",
};

const statusLabels: Record<Submission["status"], string> = {
  accepted: "Принято",
  "wrong-answer": "Неверный ответ",
  "runtime-error": "Ошибка выполнения",
  timeout: "Превышено время",
};

const statusClasses: Record<Submission["status"], string> = {
  accepted: "text-[var(--lc-success)]",
  "wrong-answer": "text-[var(--lc-danger-strong)]",
  "runtime-error": "text-[var(--lc-danger-strong)]",
  timeout: "text-[var(--lc-danger-strong)]",
};

const activityChartConfig = {
  solved: {
    label: "Решено",
    color: "var(--lc-success)",
  },
  submissions: {
    label: "Попытки",
    color: "var(--lc-easy)",
  },
} satisfies ChartConfig;

const dashboardTabsTriggerClassName =
  "px-4 text-sm text-[var(--lc-muted)] data-active:bg-[var(--lc-panel-raised)] data-active:text-[var(--lc-text-strong)] data-[state=active]:bg-[var(--lc-panel-raised)] data-[state=active]:text-[var(--lc-text-strong)] data-[state=active]:shadow-sm";

const activityTabsTriggerClassName =
  "px-3 text-xs text-[var(--lc-muted)] data-active:bg-[var(--lc-panel-raised)] data-active:text-[var(--lc-text-strong)] data-[state=active]:bg-[var(--lc-panel-raised)] data-[state=active]:text-[var(--lc-text-strong)] data-[state=active]:shadow-sm";

function getSubmittedAtTime(submission: Submission) {
  const time = new Date(submission.submittedAt).getTime();

  return Number.isFinite(time) ? time : 0;
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function sortSubmissions(submissions: Submission[]) {
  return [...submissions].sort(
    (left, right) => getSubmittedAtTime(right) - getSubmittedAtTime(left),
  );
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return "0.0%";
  }

  return `${value.toFixed(1)}%`;
}

function getPassedCount(submission: Submission) {
  return submission.cases.filter((testCase) => testCase.passed).length;
}

function getSubmissionLanguageLabel(submission: Submission) {
  return getCodeLanguageLabel(
    isCodeLanguage(submission.language) ? submission.language : undefined,
  );
}

function buildHistoryItems(problems: Problem[]): ProblemHistoryItem[] {
  return problems
    .map((problem) => {
      const submissions = sortSubmissions(problem.submissions ?? []);
      const lastSubmission = submissions[0];

      if (!lastSubmission) {
        return null;
      }

      return {
        problem,
        submissions,
        lastSubmission,
        solved: submissions.some((submission) => submission.status === "accepted"),
      };
    })
    .filter((item): item is ProblemHistoryItem => item !== null)
    .sort(
      (left, right) =>
        getSubmittedAtTime(right.lastSubmission) - getSubmittedAtTime(left.lastSubmission),
    );
}

function buildSummary(items: ProblemHistoryItem[]): Summary {
  const totalSubmissions = items.reduce((count, item) => count + item.submissions.length, 0);
  const acceptedSubmissions = items.reduce(
    (count, item) =>
      count + item.submissions.filter((submission) => submission.status === "accepted").length,
    0,
  );
  const solvedItems = items.filter((item) => item.solved);

  return {
    acceptedSubmissions,
    acceptanceRate: totalSubmissions > 0 ? (acceptedSubmissions / totalSubmissions) * 100 : 0,
    solvedByDifficulty: {
      Easy: solvedItems.filter((item) => item.problem.difficulty === "Easy").length,
      Medium: solvedItems.filter((item) => item.problem.difficulty === "Medium").length,
      Hard: solvedItems.filter((item) => item.problem.difficulty === "Hard").length,
    },
    solvedCount: solvedItems.length,
    solvedRate: items.length > 0 ? (solvedItems.length / items.length) * 100 : 0,
    totalSubmissions,
    triedCount: items.length,
  };
}

function buildActivityPoints(items: ProblemHistoryItem[]) {
  const today = new Date();
  const start = new Date(today);

  start.setDate(today.getDate() - 29);

  const points: ActivityPoint[] = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(start);

    date.setDate(start.getDate() + index);

    return {
      date: getDateKey(date),
      label: new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
      }).format(date),
      solved: 0,
      submissions: 0,
    };
  });
  const pointsByDate = new Map(points.map((point) => [point.date, point]));

  for (const item of items) {
    const acceptedDates = new Set<string>();

    for (const submission of item.submissions) {
      const submittedAt = new Date(submission.submittedAt);
      const point = pointsByDate.get(getDateKey(submittedAt));

      if (!point) {
        continue;
      }

      point.submissions += 1;

      if (submission.status === "accepted") {
        acceptedDates.add(point.date);
      }
    }

    for (const date of acceptedDates) {
      const point = pointsByDate.get(date);

      if (point) {
        point.solved += 1;
      }
    }
  }

  return points;
}

function filterHistoryItems(items: ProblemHistoryItem[], filter: HistoryFilter) {
  if (filter === "solved") {
    return items.filter((item) => item.solved);
  }

  if (filter === "unsolved") {
    return items.filter((item) => !item.solved);
  }

  return items;
}

function sortHistoryItems(items: ProblemHistoryItem[], sortMode: SortMode) {
  return [...items].sort((left, right) => {
    if (sortMode === "submissions") {
      return right.submissions.length - left.submissions.length;
    }

    if (sortMode === "title") {
      return left.problem.title.localeCompare(right.problem.title);
    }

    return getSubmittedAtTime(right.lastSubmission) - getSubmittedAtTime(left.lastSubmission);
  });
}

function DifficultyLabel({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={cn("text-xs font-medium", difficultyClasses[difficulty])}>
      {difficultyLabels[difficulty]}
    </span>
  );
}

function SubmissionStatus({
  status,
  className,
}: {
  status: Submission["status"];
  className?: string;
}) {
  return (
    <span className={cn("font-semibold", statusClasses[status], className)}>
      {statusLabels[status]}
    </span>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel)] p-4">
      <div className="mb-2 text-sm text-[var(--lc-muted)]">{label}</div>
      <div className="text-3xl font-semibold text-[var(--lc-text-strong)]">{value}</div>
    </div>
  );
}

function SummaryPanel({
  activityPoints,
  items,
  summary,
}: {
  activityPoints: ActivityPoint[];
  items: ProblemHistoryItem[];
  summary: Summary;
}) {
  const [activityMode, setActivityMode] = useState<ActivityMode>("solved");

  return (
    <aside className="min-w-0 space-y-5">
      <section>
        <h2 className="mb-4 text-2xl font-semibold text-[var(--lc-text-strong)]">Сводка</h2>

        <div className="rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel-raised)] p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--lc-text-strong)]">
              <ListChecks className="h-4 w-4 text-[var(--lc-success)]" />
              Всего решено
            </div>
            <div className="text-sm text-[var(--lc-muted)]">
              {formatPercent(summary.solvedRate)} от попыток
            </div>
          </div>

          <div className="mb-5">
            <span className="text-4xl font-semibold text-[var(--lc-text-strong)]">
              {summary.solvedCount}
            </span>
            <span className="ml-2 text-sm font-medium text-[var(--lc-muted)]">
              из {summary.triedCount}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
            {(["Easy", "Medium", "Hard"] as Difficulty[]).map((difficulty) => (
              <div
                key={difficulty}
                className={cn(
                  "rounded-md bg-[var(--lc-hover)] px-2.5 py-2",
                  difficultyClasses[difficulty],
                )}
              >
                {difficultyLabels[difficulty]}
                <span className="float-right text-[var(--lc-text-strong)]">
                  {summary.solvedByDifficulty[difficulty]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <SummaryMetric label="Попытки" value={String(summary.totalSubmissions)} />
        <SummaryMetric label="Принято" value={String(summary.acceptedSubmissions)} />
        <SummaryMetric label="Успешность попыток" value={formatPercent(summary.acceptanceRate)} />
        <SummaryMetric label="Задач с попытками" value={String(items.length)} />
      </div>

      <section className="rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel-raised)] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--lc-text-strong)]">
            <BarChart3 className="h-4 w-4 text-[var(--lc-easy)]" />
            Активность за 30 дней
          </div>
          <Tabs
            value={activityMode}
            onValueChange={(value) => setActivityMode(value as ActivityMode)}
          >
            <TabsList className="h-8 bg-[var(--lc-hover)]" variant="default">
              <TabsTrigger className={activityTabsTriggerClassName} value="solved">
                Решено
              </TabsTrigger>
              <TabsTrigger className={activityTabsTriggerClassName} value="submissions">
                Попытки
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ChartContainer className="h-56 w-full aspect-auto" config={activityChartConfig}>
          <BarChart
            accessibilityLayer
            data={activityPoints}
            margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis axisLine={false} dataKey="label" interval={6} tickLine={false} tickMargin={8} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={32} />
            <ChartTooltip
              content={<ChartTooltipContent hideLabel />}
              cursor={{ fill: "var(--lc-hover)" }}
            />
            <Bar
              dataKey={activityMode}
              fill={`var(--color-${activityMode})`}
              minPointSize={2}
              name={activityMode === "solved" ? "Решено" : "Попытки"}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </section>
    </aside>
  );
}

function AttemptsTable({ submissions }: { submissions: Submission[] }) {
  return (
    <div className="border-t border-[var(--lc-border)] bg-[var(--lc-panel)] px-5 py-4">
      <div className="grid grid-cols-[150px_minmax(130px,1fr)_130px_110px_120px_90px] gap-4 px-3 pb-2 text-xs font-semibold text-[var(--lc-muted)]">
        <div>Дата</div>
        <div>Результат</div>
        <div>Язык</div>
        <div>Время</div>
        <div>Память</div>
        <div>Тесты</div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--lc-border)]">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className="grid grid-cols-[150px_minmax(130px,1fr)_130px_110px_120px_90px] gap-4 border-b border-[var(--lc-border)] px-3 py-3 text-xs last:border-b-0"
          >
            <div className="truncate text-[var(--lc-muted)]">
              {formatDateTime(submission.submittedAt)}
            </div>
            <SubmissionStatus className="truncate" status={submission.status} />
            <div className="truncate text-[var(--lc-text)]">
              {getSubmissionLanguageLabel(submission)}
            </div>
            <div className="inline-flex items-center gap-1 font-mono text-[var(--lc-text)]">
              <Clock3 className="h-3.5 w-3.5 text-[var(--lc-subtle)]" />
              {formatRuntime(submission.runtimeMs)}
            </div>
            <div className="inline-flex items-center gap-1 font-mono text-[var(--lc-text)]">
              <Cpu className="h-3.5 w-3.5 text-[var(--lc-subtle)]" />
              {formatMemory(submission.memoryBytes)}
            </div>
            <div className="text-[var(--lc-muted)]">
              {getPassedCount(submission)}/{submission.cases.length}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryTable({
  items,
  onOpenProblem,
}: {
  items: ProblemHistoryItem[];
  onOpenProblem: (problemId: string) => void;
}) {
  const [expandedProblemIds, setExpandedProblemIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpandedProblemIds((current) => {
      const nextIds = new Set(items.map((item) => item.problem.id));

      return Object.fromEntries(
        Object.entries(current).filter(([problemId]) => nextIds.has(problemId)),
      );
    });
  }, [items]);

  function toggleProblem(problemId: string) {
    setExpandedProblemIds((current) => ({
      ...current,
      [problemId]: !current[problemId],
    }));
  }

  function toggleProblemFromKeyboard(event: KeyboardEvent<HTMLDivElement>, problemId: string) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    toggleProblem(problemId);
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel-raised)]">
      <div className="grid grid-cols-[165px_minmax(260px,1fr)_150px_110px_110px] gap-4 border-b border-[var(--lc-border)] bg-[var(--lc-panel-header)] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--lc-muted)]">
        <div>Последняя отправка</div>
        <div>Задача</div>
        <div>Последний результат</div>
        <div>Попытки</div>
        <div>Перейти</div>
      </div>

      {items.map((item) => {
        const expanded = expandedProblemIds[item.problem.id] ?? false;
        const StatusIcon = item.solved ? CheckCircle2 : Circle;
        const ChevronIcon = expanded ? ChevronDown : ChevronRight;

        return (
          <div key={item.problem.id} className="border-b border-[var(--lc-border)] last:border-b-0">
            <div
              role="button"
              tabIndex={0}
              className={cn(
                "grid w-full cursor-pointer grid-cols-[165px_minmax(260px,1fr)_150px_110px_110px] items-center gap-4 px-5 py-4 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lc-border-strong)]",
                expanded ? "bg-[var(--lc-active)]" : "hover:bg-[var(--lc-hover)]",
              )}
              onClick={() => toggleProblem(item.problem.id)}
              onKeyDown={(event) => toggleProblemFromKeyboard(event, item.problem.id)}
            >
              <div className="truncate text-[var(--lc-muted)]">
                {formatDateTime(item.lastSubmission.submittedAt)}
              </div>

              <div className="flex min-w-0 items-center gap-3">
                <StatusIcon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    item.solved ? "text-[var(--lc-success)]" : "text-[var(--lc-subtle)]",
                  )}
                />

                <div className="min-w-0">
                  <div className="truncate font-semibold text-[var(--lc-text-strong)]">
                    {item.problem.number}. {item.problem.title}
                  </div>
                  <DifficultyLabel difficulty={item.problem.difficulty} />
                </div>
              </div>

              <SubmissionStatus className="truncate text-sm" status={item.lastSubmission.status} />

              <div className="flex items-center justify-between gap-2 text-[var(--lc-muted)]">
                <span>{item.submissions.length}</span>
                <ChevronIcon className="h-4 w-4 shrink-0" />
              </div>

              <Button
                className="justify-self-start"
                size="sm"
                variant="secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenProblem(item.problem.id);
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Открыть
              </Button>
            </div>

            {expanded ? <AttemptsTable submissions={item.submissions} /> : null}
          </div>
        );
      })}
    </div>
  );
}

export function UserDashboardPage({
  problemIndex,
  onBackToProblems,
  onLoadProblems,
  onOpenProblem,
}: {
  problemIndex: ProblemListItem[];
  onBackToProblems: () => void;
  onLoadProblems: () => Promise<Problem[]>;
  onOpenProblem: (problemId: string) => void;
}) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("last-submitted");

  const historyItems = useMemo(() => buildHistoryItems(problems), [problems]);
  const visibleHistoryItems = useMemo(() => {
    return sortHistoryItems(filterHistoryItems(historyItems, historyFilter), sortMode);
  }, [historyFilter, historyItems, sortMode]);
  const summary = useMemo(() => buildSummary(historyItems), [historyItems]);
  const activityPoints = useMemo(() => buildActivityPoints(historyItems), [historyItems]);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setErrorText("");

    void onLoadProblems()
      .then((nextProblems) => {
        if (!cancelled) {
          setProblems(nextProblems);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorText(error instanceof Error ? error.message : "Не удалось загрузить дашборд");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onLoadProblems, problemIndex]);

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-[var(--lc-page)]">
      <div className="mx-auto grid max-w-[1480px] grid-cols-[minmax(0,1fr)_360px] gap-6 px-8 py-7">
        <section className="min-w-0">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold text-[var(--lc-text-strong)]">
                История практики
              </h1>
              <p className="mt-1 text-sm text-[var(--lc-muted)]">
                Все задачи, по которым были отправлены решения, и подробная история попыток.
              </p>
            </div>

            <Button variant="secondary" onClick={onBackToProblems}>
              <RotateCcw className="h-4 w-4" />К задачам
            </Button>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Tabs
              value={historyFilter}
              onValueChange={(value) => setHistoryFilter(value as HistoryFilter)}
            >
              <TabsList className="h-9 bg-[var(--lc-hover)]" variant="default">
                <TabsTrigger className={dashboardTabsTriggerClassName} value="all">
                  Все
                </TabsTrigger>
                <TabsTrigger className={dashboardTabsTriggerClassName} value="solved">
                  Решённые
                </TabsTrigger>
                <TabsTrigger className={dashboardTabsTriggerClassName} value="unsolved">
                  Не решённые
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
              <SelectTrigger className="h-9 w-52 border-[var(--lc-border)] bg-[var(--lc-panel)] text-[var(--lc-text-strong)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--lc-panel-raised)]">
                <SelectItem value="last-submitted">Сначала новые</SelectItem>
                <SelectItem value="submissions">Больше попыток</SelectItem>
                <SelectItem value="title">По названию</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-[var(--lc-border-strong)] bg-[var(--lc-panel-raised)] text-sm text-[var(--lc-muted)]">
              Загружаем историю...
            </div>
          ) : null}

          {!loading && errorText ? (
            <div className="rounded-lg border border-[var(--lc-danger-border)] bg-[var(--lc-danger-bg)] p-4 text-sm text-[var(--lc-danger-text)]">
              {errorText}
            </div>
          ) : null}

          {!loading && !errorText && historyItems.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-[var(--lc-border-strong)] bg-[var(--lc-panel-raised)] p-6 text-center text-sm text-[var(--lc-muted)]">
              Отправьте решение, чтобы здесь появилась история практики.
            </div>
          ) : null}

          {!loading && !errorText && historyItems.length > 0 ? (
            visibleHistoryItems.length > 0 ? (
              <HistoryTable items={visibleHistoryItems} onOpenProblem={onOpenProblem} />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-[var(--lc-border-strong)] bg-[var(--lc-panel-raised)] p-6 text-center text-sm text-[var(--lc-muted)]">
                По выбранному фильтру записей нет.
              </div>
            )
          ) : null}
        </section>

        <ScrollArea className="min-h-[calc(100vh-104px)]">
          <SummaryPanel activityPoints={activityPoints} items={historyItems} summary={summary} />
        </ScrollArea>
      </div>
    </main>
  );
}
