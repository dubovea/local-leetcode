import { CheckCircle2, CheckSquare, Circle, XCircle } from "lucide-react";
import type {
  CaseRunResult,
  ConsoleLog,
  RunResult,
  RunStatus,
  TestCase,
} from "@/entities/problem/model/types";
import { formatRuntime } from "@/shared/lib/date";
import { StatusText } from "@/shared/ui/StatusText";
import { cn } from "@/shared/lib/cn";

function firstFailedCase(cases: CaseRunResult[]) {
  return cases.find((testCase) => !testCase.passed) ?? cases[0];
}

function Logs({ logs }: { logs: ConsoleLog[] }) {
  if (logs.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="mb-2 text-xs font-semibold text-[var(--lc-muted)]">Console</div>
      <div className="max-h-40 overflow-auto rounded-lg bg-[var(--lc-code)] p-3 font-mono text-xs">
        {logs.map((log, index) => (
          <div
            key={index}
            className={cn(
              "whitespace-pre-wrap leading-5",
              log.type === "error" ? "text-[var(--lc-danger-text)]" : "text-[var(--lc-text)]",
            )}
          >
            {log.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function ValueBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4">
      <div className="mb-2 text-xs font-semibold text-[var(--lc-muted)]">{label}</div>
      <pre className="overflow-auto rounded-lg bg-[var(--lc-code-strong)] p-3 font-mono text-xs leading-5 text-[var(--lc-text-strong)]">
        {value || " "}
      </pre>
    </div>
  );
}

function CaseTabs({
  cases,
  visibleCaseId,
  onActiveCaseChange,
}: {
  cases: Array<{ id: string; passed?: boolean }>;
  visibleCaseId?: string;
  onActiveCaseChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-[var(--lc-border)] px-3 py-2">
      {cases.map((testCase, index) => {
        const ResultIcon =
          typeof testCase.passed === "boolean"
            ? testCase.passed
              ? CheckCircle2
              : XCircle
            : Circle;

        return (
          <button
            key={testCase.id}
            className={cn(
              "flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors",
              testCase.id === visibleCaseId
                ? "bg-[var(--lc-active)] text-[var(--lc-text-strong)]"
                : "text-[var(--lc-muted)] hover:bg-[var(--lc-hover)]",
            )}
            type="button"
            onClick={() => onActiveCaseChange(testCase.id)}
          >
            {typeof testCase.passed === "boolean" ? (
              <ResultIcon
                className={cn(
                  "h-3.5 w-3.5",
                  testCase.passed ? "text-[var(--lc-success)]" : "text-[var(--lc-danger-strong)]",
                )}
              />
            ) : null}
            Case {index + 1}
          </button>
        );
      })}
    </div>
  );
}

export function TestResultPanel({
  result,
  activeCaseId,
  testCases,
  onActiveCaseChange,
}: {
  result: RunResult | null;
  activeCaseId?: string;
  testCases: TestCase[];
  onActiveCaseChange: (id: string) => void;
}) {
  if (!result) {
    const activeCase = testCases.find((testCase) => testCase.id === activeCaseId) ?? testCases[0];

    return (
      <div className="flex h-full min-h-0 flex-col bg-[var(--lc-panel)]">
        <div className="flex h-11 shrink-0 items-center border-b border-[var(--lc-border)] px-3 text-sm font-medium text-[var(--lc-text)]">
          <CheckSquare className="mr-2 h-4 w-4 text-[var(--lc-success)]" />
          Testcase
        </div>
        <CaseTabs
          cases={testCases}
          visibleCaseId={activeCase.id}
          onActiveCaseChange={onActiveCaseChange}
        />
        <div className="overflow-auto p-4">
          <ValueBlock label="Input" value={activeCase.input} />
          <ValueBlock label="Expected" value={activeCase.expected} />
        </div>
      </div>
    );
  }

  const fallbackCase = firstFailedCase(result.cases);
  const visibleCase = result.cases.find((testCase) => testCase.id === activeCaseId) ?? fallbackCase;
  const status: RunStatus = result.status;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--lc-panel)]">
      <div className="flex h-11 shrink-0 items-center gap-3 border-b border-[var(--lc-border)] px-3 text-sm font-medium text-[var(--lc-text)]">
        <CheckSquare className="h-4 w-4 text-[var(--lc-success)]" />
        <span>Test Result</span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="p-4 pb-2">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <StatusText className="text-xl" status={status} />
            <span className="text-sm text-[var(--lc-muted)]">
              Runtime: {formatRuntime(result.durationMs)}
            </span>
            <span className="text-sm text-[var(--lc-muted)]">
              {result.passedCount}/{result.totalCount} cases passed
            </span>
          </div>

          {result.status === "runtime-error" || result.status === "timeout" ? (
            <pre className="mb-4 max-h-48 overflow-auto rounded-lg bg-[var(--lc-danger-soft)] p-4 font-mono text-xs leading-5 text-[var(--lc-danger-text)]">
              {result.errorText ?? visibleCase?.errorText}
            </pre>
          ) : null}
        </div>

        <CaseTabs
          cases={result.cases}
          visibleCaseId={visibleCase?.id}
          onActiveCaseChange={onActiveCaseChange}
        />

        <div className="p-4 pt-0">
          {visibleCase ? (
            <>
              <ValueBlock label="Input" value={visibleCase.inputText} />
              <ValueBlock label="Output" value={visibleCase.outputText} />
              <ValueBlock label="Expected" value={visibleCase.expectedText} />
              {visibleCase.errorText ? (
                <ValueBlock label="Error" value={visibleCase.errorText} />
              ) : null}
            </>
          ) : null}

          <Logs logs={result.logs} />
        </div>
      </div>
    </div>
  );
}
