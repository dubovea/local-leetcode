import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { Activity, Cpu, RotateCcw, Sparkles, Timer, Trash2 } from "lucide-react";
import { Bar, CartesianGrid, Cell, ComposedChart, Line, XAxis, YAxis } from "recharts";
import type { CodeLanguage, Submission } from "@/entities/problem/model/types";
import {
  DEFAULT_CODE_LANGUAGE,
  codeLanguageOptions,
  getCodeLanguageConfig,
  getCodeLanguageLabel,
  isCodeLanguage,
} from "@/entities/problem/model/codeLanguages";
import { formatDateTime, formatMemory, formatRuntime } from "@/shared/lib/date";
import { Button } from "@/shared/ui/button";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/shared/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { StatusText } from "@/shared/ui/StatusText";

type SortMode = "chronological" | "runtime" | "memory";
type LanguageFilter = "all" | CodeLanguage;

type PerformancePoint = {
  id: string;
  attemptNumber: number;
  label: string;
  runtimeMs: number;
  memoryBytes?: number;
  memoryKb: number | null;
  language: CodeLanguage;
  languageLabel: string;
  submittedAt: string;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getAcceptedPoints(submissions: Submission[]): PerformancePoint[] {
  return submissions
    .map((submission, index) => {
      const language = getSubmissionLanguage(submission);

      return {
        id: submission.id,
        attemptNumber: index + 1,
        label: `#${index + 1}`,
        runtimeMs: submission.runtimeMs,
        memoryBytes: submission.memoryBytes,
        memoryKb: isFiniteNumber(submission.memoryBytes) ? submission.memoryBytes / 1024 : null,
        language,
        languageLabel: getCodeLanguageLabel(language),
        status: submission.status,
        submittedAt: submission.submittedAt,
      };
    })
    .filter(
      (submission) => submission.status === "accepted" && isFiniteNumber(submission.runtimeMs),
    );
}

function getSubmissionLanguage(submission: Submission): CodeLanguage {
  return isCodeLanguage(submission.language) ? submission.language : DEFAULT_CODE_LANGUAGE;
}

function getBestPoint<T extends PerformancePoint>(
  points: T[],
  readValue: (point: T) => number | undefined,
) {
  return points.reduce<T | null>((bestPoint, point) => {
    const value = readValue(point);
    const bestValue = bestPoint ? readValue(bestPoint) : undefined;

    if (!isFiniteNumber(value)) {
      return bestPoint;
    }

    if (!isFiniteNumber(bestValue) || value < bestValue) {
      return point;
    }

    return bestPoint;
  }, null);
}

function sortPoints(points: PerformancePoint[], sortMode: SortMode) {
  return [...points].sort((left, right) => {
    if (sortMode === "runtime") {
      return left.runtimeMs - right.runtimeMs;
    }

    if (sortMode === "memory") {
      const leftMemory = isFiniteNumber(left.memoryBytes)
        ? left.memoryBytes
        : Number.POSITIVE_INFINITY;
      const rightMemory = isFiniteNumber(right.memoryBytes)
        ? right.memoryBytes
        : Number.POSITIVE_INFINITY;

      return leftMemory - rightMemory;
    }

    return left.attemptNumber - right.attemptNumber;
  });
}

function getBestOverallPoint(points: PerformancePoint[]) {
  const memoryPoints = points.filter((point) => isFiniteNumber(point.memoryBytes));
  const maxRuntime = Math.max(...points.map((point) => point.runtimeMs), 1);
  const maxMemory =
    memoryPoints.length > 0
      ? Math.max(...memoryPoints.map((point) => point.memoryBytes ?? 0), 1)
      : 1;

  return points.reduce<PerformancePoint | null>((bestPoint, point) => {
    const score =
      point.runtimeMs / maxRuntime +
      (isFiniteNumber(point.memoryBytes) ? point.memoryBytes / maxMemory : 1);
    const bestScore = bestPoint
      ? bestPoint.runtimeMs / maxRuntime +
        (isFiniteNumber(bestPoint.memoryBytes) ? bestPoint.memoryBytes / maxMemory : 1)
      : Number.POSITIVE_INFINITY;

    return score < bestScore ? point : bestPoint;
  }, null);
}

function MetricPill({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-[var(--lc-border)] bg-[var(--lc-panel)] px-2.5 py-1.5">
      <span className="text-[var(--lc-muted)]">{icon}</span>
      <span className="text-xs text-[var(--lc-muted)]">{label}</span>
      <span className="text-xs font-semibold text-[var(--lc-text-strong)]">{value}</span>
    </div>
  );
}

function PerformanceTooltip({
  active,
  payload,
  bestRuntimeId,
  bestMemoryId,
  bestOverallId,
}: {
  active?: boolean;
  payload?: Array<{ payload?: PerformancePoint }>;
  bestRuntimeId?: string;
  bestMemoryId?: string;
  bestOverallId?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload.find((item) => item.payload)?.payload;

  if (!point) {
    return null;
  }

  return (
    <div className="min-w-52 rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel-raised)] p-3 text-xs shadow-xl">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="font-semibold text-[var(--lc-text-strong)]">Solution {point.label}</div>
        <div className="text-[var(--lc-muted)]">{point.languageLabel}</div>
      </div>
      <div className="mb-2 text-[var(--lc-muted)]">{formatDateTime(point.submittedAt)}</div>

      <div className="grid gap-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--lc-muted)]">Runtime</span>
          <span className="font-mono font-semibold text-[var(--lc-text-strong)]">
            {formatRuntime(point.runtimeMs)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--lc-muted)]">Estimated memory</span>
          <span className="font-mono font-semibold text-[var(--lc-text-strong)]">
            {formatMemory(point.memoryBytes)}
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {point.id === bestOverallId ? (
          <span className="rounded bg-[var(--lc-success-soft)] px-1.5 py-0.5 text-[var(--lc-success)]">
            Best
          </span>
        ) : null}
        {point.id === bestRuntimeId ? (
          <span className="rounded bg-[var(--lc-hover)] px-1.5 py-0.5 text-[var(--lc-text)]">
            Fastest
          </span>
        ) : null}
        {point.id === bestMemoryId ? (
          <span className="rounded bg-[var(--lc-hover)] px-1.5 py-0.5 text-[var(--lc-text)]">
            Least estimated memory
          </span>
        ) : null}
      </div>
    </div>
  );
}

const chartConfig = {
  runtimeMs: {
    label: "Runtime",
    color: "var(--lc-success)",
  },
  memoryKb: {
    label: "Estimated memory",
    color: "var(--lc-warning)",
  },
} satisfies ChartConfig;

function SolutionsPerformance({ submissions }: { submissions: Submission[] }) {
  const [sortMode, setSortMode] = useState<SortMode>("chronological");
  const points = useMemo(() => getAcceptedPoints(submissions), [submissions]);
  const memoryPoints = points.filter((point) => isFiniteNumber(point.memoryBytes));
  const bestRuntimePoint = getBestPoint(points, (point) => point.runtimeMs);
  const bestMemoryPoint = getBestPoint(memoryPoints, (point) => point.memoryBytes);
  const bestOverallPoint = getBestOverallPoint(points);
  const sortedPoints = useMemo(() => sortPoints(points, sortMode), [points, sortMode]);
  const runtimeDomainMax = useMemo(() => {
    const maxRuntime = Math.max(...points.map((point) => point.runtimeMs), 0);

    return Math.max(1, Math.ceil(maxRuntime * 1.1));
  }, [points]);

  if (points.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-[var(--lc-border)] bg-[var(--lc-panel-raised)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--lc-border)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--lc-success)]" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--lc-text-strong)]">Performance</h3>
            <p className="text-xs text-[var(--lc-muted)]">
              {points.length} accepted attempt{points.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MetricPill
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="Best"
            value={
              bestOverallPoint
                ? `${bestOverallPoint.label} - ${formatRuntime(bestOverallPoint.runtimeMs)}`
                : "N/A"
            }
          />
          <MetricPill
            icon={<Timer className="h-3.5 w-3.5" />}
            label="Best time"
            value={bestRuntimePoint ? formatRuntime(bestRuntimePoint.runtimeMs) : "N/A"}
          />
          <MetricPill
            icon={<Cpu className="h-3.5 w-3.5" />}
            label="Best estimated memory"
            value={bestMemoryPoint ? formatMemory(bestMemoryPoint.memoryBytes) : "N/A"}
          />
          <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
            <SelectTrigger className="h-8 w-36 bg-[var(--lc-panel)] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[var(--lc-panel-raised)]">
              <SelectItem value="chronological">By attempt</SelectItem>
              <SelectItem value="runtime">By time</SelectItem>
              <SelectItem value="memory">By estimated memory</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="px-4 py-4">
        <ChartContainer className="h-64 w-full aspect-auto" config={chartConfig}>
          <ComposedChart
            accessibilityLayer
            data={sortedPoints}
            margin={{ top: 12, right: 12, bottom: 8, left: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={8} />
            <YAxis
              allowDecimals
              axisLine={false}
              domain={[0, runtimeDomainMax]}
              tickFormatter={(value) => formatRuntime(Number(value))}
              tickLine={false}
              tickMargin={8}
              tickCount={5}
              width={54}
              yAxisId="runtime"
            />
            <YAxis
              axisLine={false}
              orientation="right"
              tickFormatter={(value) => formatMemory(Number(value) * 1024)}
              tickLine={false}
              tickMargin={8}
              width={72}
              yAxisId="memory"
            />
            <ChartTooltip
              content={
                <PerformanceTooltip
                  bestMemoryId={bestMemoryPoint?.id}
                  bestOverallId={bestOverallPoint?.id}
                  bestRuntimeId={bestRuntimePoint?.id}
                />
              }
              cursor={{ fill: "var(--lc-hover)" }}
            />
            <Bar
              dataKey="runtimeMs"
              fill="var(--color-runtimeMs)"
              minPointSize={4}
              name="Runtime"
              radius={[4, 4, 0, 0]}
              yAxisId="runtime"
            >
              {sortedPoints.map((point) => (
                <Cell
                  key={point.id}
                  fill={
                    point.id === bestOverallPoint?.id
                      ? "var(--lc-success)"
                      : "color-mix(in srgb, var(--lc-success) 70%, transparent)"
                  }
                />
              ))}
            </Bar>
            <Line
              connectNulls={false}
              dataKey="memoryKb"
              dot={{ fill: "var(--lc-panel-raised)", r: 4, strokeWidth: 2 }}
              name="Estimated memory"
              stroke="var(--color-memoryKb)"
              strokeWidth={2.5}
              type="monotone"
              yAxisId="memory"
            />
          </ComposedChart>
        </ChartContainer>

        <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--lc-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[var(--lc-success)]" />
            Runtime
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--lc-warning)]" />
            Estimated memory
          </span>
        </div>
      </div>
    </section>
  );
}

function defineSolutionThemes(monaco: typeof Monaco) {
  monaco.editor.defineTheme("medikcode-solution-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#171717",
      "editorLineNumber.foreground": "#777777",
      "editorCursor.foreground": "#ffffff",
      "editor.selectionBackground": "#3a3d41",
    },
  });
  monaco.editor.defineTheme("medikcode-solution-light", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#f7f7f8",
      "editorLineNumber.foreground": "#8a8a8a",
      "editorCursor.foreground": "#111827",
      "editor.selectionBackground": "#dbeafe",
    },
  });
}

function codeHeight(code: string) {
  const lineCount = code.split("\n").length;

  return Math.min(360, Math.max(170, lineCount * 20 + 22));
}

function SolutionCodeBlock({
  code,
  language,
  submissionId,
}: {
  code: string;
  language: CodeLanguage;
  submissionId: string;
}) {
  const languageConfig = getCodeLanguageConfig(language);

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--lc-border)] bg-[var(--lc-code)]">
      <Editor
        beforeMount={defineSolutionThemes}
        defaultLanguage={languageConfig.monacoLanguage}
        height={codeHeight(code)}
        language={languageConfig.monacoLanguage}
        options={{
          automaticLayout: true,
          contextmenu: false,
          domReadOnly: true,
          folding: false,
          fontFamily: "JetBrains Mono, Consolas, monospace",
          fontSize: 12,
          lineDecorationsWidth: 8,
          lineNumbers: "on",
          lineNumbersMinChars: 3,
          minimap: { enabled: false },
          overviewRulerLanes: 0,
          readOnly: true,
          renderLineHighlight: "none",
          scrollBeyondLastLine: false,
          scrollbar: {
            horizontal: "auto",
            vertical: "auto",
            verticalScrollbarSize: 8,
          },
          wordWrap: "on",
        }}
        path={`submission-${submissionId}.${languageConfig.extension}`}
        theme={
          document.documentElement.dataset.theme === "light"
            ? "medikcode-solution-light"
            : "medikcode-solution-dark"
        }
        value={code}
      />
    </div>
  );
}

export function SolutionsHistory({
  submissions,
  onRestore,
  onDelete,
}: {
  submissions: Submission[];
  onRestore: (submissionId: string) => void;
  onDelete: (submissionId: string) => void;
}) {
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>("all");
  const availableLanguageOptions = useMemo(() => {
    const languages = new Set(submissions.map(getSubmissionLanguage));

    return codeLanguageOptions.filter((option) => languages.has(option.value));
  }, [submissions]);
  const visibleSubmissions = useMemo(() => {
    if (languageFilter === "all") {
      return submissions;
    }

    return submissions.filter((submission) => getSubmissionLanguage(submission) === languageFilter);
  }, [languageFilter, submissions]);

  useEffect(() => {
    if (
      languageFilter !== "all" &&
      !submissions.some((submission) => getSubmissionLanguage(submission) === languageFilter)
    ) {
      setLanguageFilter("all");
    }
  }, [languageFilter, submissions]);

  if (submissions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-[var(--lc-border-strong)] bg-[var(--lc-panel-raised)] p-8 text-center text-sm text-[var(--lc-muted)]">
        Отправьте решение, чтобы увидеть здесь успешные и неудачные попытки.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Select
          value={languageFilter}
          onValueChange={(value) => setLanguageFilter(value as LanguageFilter)}
        >
          <SelectTrigger className="h-8 w-48 bg-[var(--lc-panel)] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[var(--lc-panel-raised)]">
            <SelectItem value="all">All languages</SelectItem>
            {availableLanguageOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SolutionsPerformance submissions={visibleSubmissions} />

      {visibleSubmissions.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-[var(--lc-border-strong)] bg-[var(--lc-panel-raised)] p-8 text-center text-sm text-[var(--lc-muted)]">
          No submissions for this language yet.
        </div>
      ) : null}

      {[...visibleSubmissions].reverse().map((submission, index) => {
        const language = getSubmissionLanguage(submission);

        return (
          <article
            key={submission.id}
            className="rounded-xl border border-[var(--lc-border)] bg-[var(--lc-panel-raised)]"
          >
            <header className="flex items-center justify-between gap-3 border-b border-[var(--lc-border)] px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <StatusText status={submission.status} />
                <span className="text-xs text-[var(--lc-muted)]">
                  #{visibleSubmissions.length - index}
                </span>
                <span className="rounded-md bg-[var(--lc-code)] px-2 py-1 text-xs font-medium text-[var(--lc-text)]">
                  {getCodeLanguageLabel(language)}
                </span>
                <span className="truncate text-xs text-[var(--lc-muted)]">
                  {formatDateTime(submission.submittedAt)}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs text-[var(--lc-muted)]">
                <span>{formatRuntime(submission.runtimeMs)}</span>
                {submission.status === "accepted" ? (
                  <span title="Estimated memory">{formatMemory(submission.memoryBytes)}</span>
                ) : null}
                <Button
                  className="h-8 px-2 text-xs"
                  title="Restore this code to editor"
                  variant="ghost"
                  onClick={() => onRestore(submission.id)}
                >
                  <RotateCcw className="h-4 w-4" />
                  Restore
                </Button>
                <Button
                  aria-label="Delete this submission"
                  className="h-8 px-2 text-xs"
                  title="Delete this submission"
                  variant="ghost"
                  onClick={() => onDelete(submission.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </header>

            {submission.errorText ? (
              <pre className="m-4 max-h-44 overflow-auto rounded-lg bg-[var(--lc-danger-soft)] p-3 text-xs text-[var(--lc-danger-text)]">
                {submission.errorText}
              </pre>
            ) : null}

            <div className="px-4 py-3">
              <div className="mb-2 flex items-center gap-3 text-xs text-[var(--lc-muted)]">
                <span className="font-semibold">Cases</span>
                <span>
                  {submission.cases.filter((testCase) => testCase.passed).length}/
                  {submission.cases.length} passed
                </span>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {submission.cases.map((testCase, caseIndex) => (
                  <span
                    key={testCase.id}
                    className="inline-flex items-center gap-1 rounded-md bg-[var(--lc-code)] px-2 py-1 text-xs text-[var(--lc-text)]"
                  >
                    <span
                      className={
                        testCase.passed
                          ? "h-2 w-2 rounded-full bg-[var(--lc-success)]"
                          : "h-2 w-2 rounded-full bg-[var(--lc-danger-strong)]"
                      }
                    />
                    Case {caseIndex + 1}
                  </span>
                ))}
              </div>

              <div className="mb-2 text-xs font-semibold text-[var(--lc-muted)]">Code</div>
              <SolutionCodeBlock
                code={submission.code}
                language={language}
                submissionId={submission.id}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
