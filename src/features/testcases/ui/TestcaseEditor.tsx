import { CheckSquare, Plus, X } from "lucide-react";
import type { TestCase } from "@/entities/problem/model/types";
import { Button } from "@/shared/ui/button";
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
        <Button onClick={addCase} variant="secondary">
          <Plus className="h-4 w-4" />
          Add Case
        </Button>
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
              "group/case flex h-8 shrink-0 items-center gap-1 rounded-md px-3 text-xs font-medium transition-colors",
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
        <Button
          aria-label="Add case"
          className="shrink-0 text-[var(--lc-muted)] hover:text-[var(--lc-text-strong)]"
          size="icon"
          title="Duplicate selected case"
          variant="ghost"
          onClick={addCase}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <label className="mb-2 block text-xs font-semibold text-[var(--lc-muted)]">Input</label>
        <Textarea
          className="mb-4 min-h-24 resize-y font-mono text-xs leading-5"
          value={activeCase.input}
          onChange={(event) => updateActiveCase({ input: event.target.value })}
          spellCheck={false}
        />

        <label className="mb-2 block text-xs font-semibold text-[var(--lc-muted)]">Expected</label>
        <Textarea
          className="min-h-20 resize-y font-mono text-xs leading-5"
          value={activeCase.expected}
          onChange={(event) => updateActiveCase({ expected: event.target.value })}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
