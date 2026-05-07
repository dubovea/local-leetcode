import type { CaseRunResult, ConsoleLog, RunResult, RunStatus, TestCase } from "@/entities/problem/model/types";
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
      <div className="mb-2 text-xs font-semibold text-[#a8a8a8]">Console</div>
      <div className="max-h-40 overflow-auto rounded-lg bg-[#171717] p-3 font-mono text-xs">
        {logs.map((log, index) => (
          <div
            key={index}
            className={cn(
              "whitespace-pre-wrap leading-5",
              log.type === "error" ? "text-[#ff8b8b]" : "text-[#d7d7d7]",
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
      <div className="mb-2 text-xs font-semibold text-[#a8a8a8]">{label}</div>
      <pre className="overflow-auto rounded-lg bg-[#2b2b2b] p-3 font-mono text-sm leading-6 text-[#f1f1f1]">
        {value || " "}
      </pre>
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
      <div className="flex h-full min-h-0 flex-col bg-[#1f1f1f]">
        <div className="flex h-11 shrink-0 items-center border-b border-[#303030] px-3 text-sm font-medium text-[#cfcfcf]">
          <span className="mr-2 text-[#2db55d]">☑</span>
          Testcase
        </div>
        <div className="flex gap-2 overflow-x-auto border-b border-[#303030] px-3 py-2">
          {testCases.map((testCase, index) => (
            <button
              key={testCase.id}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                testCase.id === activeCase.id
                  ? "bg-[#363636] text-[#f0f0f0]"
                  : "text-[#a8a8a8] hover:bg-[#2a2a2a]",
              )}
              type="button"
              onClick={() => onActiveCaseChange(testCase.id)}
            >
              Case {index + 1}
            </button>
          ))}
        </div>
        <div className="overflow-auto p-4">
          <ValueBlock label="Input" value={activeCase.input} />
          <ValueBlock label="Expected" value={activeCase.expected} />
        </div>
      </div>
    );
  }

  const visibleCase = firstFailedCase(result.cases);
  const status: RunStatus = result.status;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#1f1f1f]">
      <div className="flex h-11 shrink-0 items-center gap-3 border-b border-[#303030] px-3 text-sm font-medium text-[#cfcfcf]">
        <span className="text-[#2db55d]">☑</span>
        <span>Test Result</span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="mb-4 flex items-center gap-4">
          <StatusText className="text-xl" status={status} />
          <span className="text-sm text-[#a8a8a8]">Runtime: {formatRuntime(result.durationMs)}</span>
          <span className="text-sm text-[#a8a8a8]">
            {result.passedCount}/{result.totalCount} cases passed
          </span>
        </div>

        {result.status === "runtime-error" || result.status === "timeout" ? (
          <pre className="mb-4 max-h-48 overflow-auto rounded-lg bg-[#3a2222] p-4 font-mono text-xs leading-5 text-[#ffb4b4]">
            {result.errorText ?? visibleCase?.errorText}
          </pre>
        ) : null}

        <div className="flex gap-2 overflow-x-auto">
          {result.cases.map((testCase, index) => (
            <button
              key={testCase.id}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                testCase.id === visibleCase?.id ? "bg-[#363636] text-[#f0f0f0]" : "text-[#a8a8a8] hover:bg-[#2a2a2a]",
              )}
              type="button"
            >
              <span className={testCase.passed ? "text-[#2db55d]" : "text-[#ff5555]"}>■</span> Case {index + 1}
            </button>
          ))}
        </div>

        {visibleCase ? (
          <>
            <ValueBlock label="Input" value={visibleCase.inputText} />
            <ValueBlock label="Output" value={visibleCase.outputText} />
            <ValueBlock label="Expected" value={visibleCase.expectedText} />
            {visibleCase.errorText ? <ValueBlock label="Error" value={visibleCase.errorText} /> : null}
          </>
        ) : null}

        <Logs logs={result.logs} />
      </div>
    </div>
  );
}
