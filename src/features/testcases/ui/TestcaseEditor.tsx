import { CheckSquare, Plus, X } from "lucide-react";
import type { TestCase } from "@/entities/problem/model/types";
import { Textarea } from "@/shared/ui/textarea";
import { cn } from "@/shared/lib/cn";
import { createId } from "@/shared/lib/id";

export function TestcaseEditor({
  testCases,
  activeCaseId,
  onActiveCaseChange,
  onChange,
}: {
  testCases: TestCase[];
  activeCaseId?: string;
  onActiveCaseChange: (id: string) => void;
  onChange: (testCases: TestCase[]) => void;
}) {
  const activeCase = testCases.find((testCase) => testCase.id === activeCaseId) ?? testCases[0];

  function updateActiveCase(patch: Partial<TestCase>) {
    if (!activeCase) {
      return;
    }

    onChange(
      testCases.map((testCase) =>
        testCase.id === activeCase.id ? { ...testCase, ...patch } : testCase,
      ),
    );
  }

  function addCase() {
    const sourceCase = activeCase ?? testCases[0];
    const nextCase = {
      id: createId("case"),
      input: sourceCase?.input ?? "",
      expected: sourceCase?.expected ?? "undefined",
    };

    onChange([...testCases, nextCase]);
    onActiveCaseChange(nextCase.id);
  }

  function removeCase(caseId: string) {
    if (testCases.length <= 1) {
      return;
    }

    const deletedIndex = testCases.findIndex((testCase) => testCase.id === caseId);
    const nextCases = testCases.filter((testCase) => testCase.id !== caseId);

    onChange(nextCases);

    if (caseId === activeCase?.id) {
      const nextActiveCase =
        nextCases[Math.min(deletedIndex, nextCases.length - 1)] ?? nextCases[0];
      onActiveCaseChange(nextActiveCase.id);
    }
  }

  if (!activeCase) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center bg-[var(--lc-panel)] text-sm text-[var(--lc-muted)]">
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--lc-border)] bg-[var(--lc-button-bg)] px-3 font-medium text-[var(--lc-text-strong)] transition-colors hover:bg-[var(--lc-button-hover)]"
          type="button"
          onClick={addCase}
        >
          <Plus className="h-4 w-4" />
          Add Case
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--lc-panel)]">
      <div className="flex h-11 shrink-0 items-center border-b border-[var(--lc-border)] px-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--lc-text)]">
          <CheckSquare className="h-4 w-4 text-[var(--lc-success)]" />
          Testcase
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-[var(--lc-border)] px-3 py-2">
        {testCases.map((testCase, index) => (
          <div
            key={testCase.id}
            className={cn(
              "group/case flex h-8 shrink-0 items-center gap-1 rounded-md px-3 text-sm font-medium transition-colors",
              testCase.id === activeCase.id
                ? "bg-[var(--lc-active)] text-[var(--lc-text-strong)]"
                : "text-[var(--lc-muted)] hover:bg-[var(--lc-hover)]",
            )}
          >
            <button
              className="h-full"
              type="button"
              onClick={() => onActiveCaseChange(testCase.id)}
            >
              Case {index + 1}
            </button>
            {testCases.length > 1 ? (
              <button
                aria-label={`Delete Case ${index + 1}`}
                className="ml-0.5 hidden h-5 w-5 items-center justify-center rounded text-[var(--lc-muted)] transition-colors hover:bg-[var(--lc-hover-strong)] hover:text-[var(--lc-text-strong)] group-hover/case:inline-flex group-focus-within/case:inline-flex"
                title={`Delete Case ${index + 1}`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeCase(testCase.id);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ))}
        <button
          aria-label="Add case"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--lc-muted)] transition-colors hover:bg-[var(--lc-hover)] hover:text-[var(--lc-text-strong)]"
          title="Duplicate selected case"
          type="button"
          onClick={addCase}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <label className="mb-2 block text-xs font-semibold text-[var(--lc-muted)]">Input</label>
        <Textarea
          className="mb-4 min-h-24 resize-y font-mono"
          value={activeCase.input}
          onChange={(event) => updateActiveCase({ input: event.target.value })}
          spellCheck={false}
        />

        <label className="mb-2 block text-xs font-semibold text-[var(--lc-muted)]">Expected</label>
        <Textarea
          className="min-h-20 resize-y font-mono"
          value={activeCase.expected}
          onChange={(event) => updateActiveCase({ expected: event.target.value })}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
