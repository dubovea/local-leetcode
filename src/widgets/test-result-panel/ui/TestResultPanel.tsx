import { CheckCircle2, Circle, FileText, Terminal, XCircle } from "lucide-react";
import type {
  CaseRunResult,
  ConsoleLog,
  RunResult,
  RunStatus,
  TestCase,
} from "@/entities/problem/model/types";
import { isSmartTestCaseId } from "@/features/problem-runner/model/smartTestCases";
import { formatRuntime } from "@/shared/lib/date";
import { StatusText } from "@/shared/ui/StatusText";
import { cn } from "@/shared/lib/cn";

function firstFailedCase(cases: CaseRunResult[]) {
  return cases.find((testCase) => !testCase.passed) ?? cases[0];
}

function Logs({ logs }: { logs: ConsoleLog[] }) {
  return (
    <div className="rounded-lg bg-[var(--lc-code)] p-3 font-mono text-xs">
      {logs.map((log, index) => (
        <div
          key={index}
          className={cn(
            "whitespace-pre-wrap leading-5",
            log.type === "error" ? "text-[var(--lc-danger-text)]" : "text-[var(--lc-text)]",
          )}
        >
          {log.type === "log" ? log.text : `[${log.type}] ${log.text}`}
        </div>
      ))}
    </div>
  );
}

function ErrorBlock({ errorText }: { errorText: string }) {
  return (
    <pre className="mt-3 overflow-auto rounded-lg bg-[var(--lc-danger-soft)] p-3 font-mono text-xs leading-5 text-[var(--lc-danger-text)]">
      {errorText}
    </pre>
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
  const smartCaseNumbers = new Map<string, number>();

  for (const testCase of cases) {
    if (isSmartTestCaseId(testCase.id)) {
      smartCaseNumbers.set(testCase.id, smartCaseNumbers.size + 1);
    }
  }

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
            {smartCaseNumbers.has(testCase.id)
              ? `Авто ${smartCaseNumbers.get(testCase.id)}`
              : `Case ${index + 1}`}
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
          <FileText className="mr-2 h-4 w-4 text-[var(--lc-success)]" />
          Test Result
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
  const smartCasesCount = result.cases.filter((testCase) => isSmartTestCaseId(testCase.id)).length;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--lc-panel)]">
      <div className="flex h-11 shrink-0 items-center gap-3 border-b border-[var(--lc-border)] px-3 text-sm font-medium text-[var(--lc-text)]">
        <FileText className="h-4 w-4 text-[var(--lc-success)]" />
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
            {smartCasesCount > 0 ? (
              <span className="text-sm text-[var(--lc-muted)]">Автотесты: {smartCasesCount}</span>
            ) : null}
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

        </div>
      </div>
    </div>
  );
}

function ConsoleCaseSection({ testCase, index }: { testCase: CaseRunResult; index: number }) {
  const logs = testCase.logs ?? [];
  const ResultIcon = testCase.passed ? CheckCircle2 : XCircle;

  return (
    <section className="border-b border-[var(--lc-border)] py-4 first:pt-0 last:border-b-0 last:pb-0">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--lc-text-strong)]">
        <ResultIcon
          className={cn(
            "h-4 w-4",
            testCase.passed ? "text-[var(--lc-success)]" : "text-[var(--lc-danger-strong)]",
          )}
        />
        {testCase.name || `Case ${index + 1}`}
      </div>

      {logs.length > 0 ? (
        <Logs logs={logs} />
      ) : (
        <div className="rounded-lg bg-[var(--lc-code)] p-3 font-mono text-xs leading-5 text-[var(--lc-muted)]">
          No console output
        </div>
      )}

      {testCase.errorText ? <ErrorBlock errorText={testCase.errorText} /> : null}
    </section>
  );
}

export function ConsoleLogPanel({ result }: { result: RunResult | null }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--lc-panel)]">
      <div className="flex h-11 shrink-0 items-center border-b border-[var(--lc-border)] px-3 text-sm font-medium text-[var(--lc-text)]">
        <Terminal className="mr-2 h-4 w-4 text-[var(--lc-success)]" />
        Console
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {result ? (
          <>
            {result.cases.length > 0 ? (
              result.cases.map((testCase, index) => (
                <ConsoleCaseSection key={testCase.id} index={index} testCase={testCase} />
              ))
            ) : result.logs.length > 0 ? (
              <Logs logs={result.logs} />
            ) : null}

            {result.errorText ? <ErrorBlock errorText={result.errorText} /> : null}
          </>
        ) : (
          <div className="rounded-lg bg-[var(--lc-code)] p-3 font-mono text-xs leading-5 text-[var(--lc-muted)]">
            No console output
          </div>
        )}
      </div>
    </div>
  );
}
