import type { TestCase } from "@/entities/problem/model/types";
import { Button } from "@/shared/ui/button";
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
    onChange(
      testCases.map((testCase) =>
        testCase.id === activeCase.id ? { ...testCase, ...patch } : testCase,
      ),
    );
  }

  function addCase() {
    const nextCase = { id: createId("case"), input: "", expected: "undefined" };
    onChange([...testCases, nextCase]);
    onActiveCaseChange(nextCase.id);
  }

  function removeActiveCase() {
    if (testCases.length <= 1) {
      return;
    }

    const nextCases = testCases.filter((testCase) => testCase.id !== activeCase.id);
    onChange(nextCases);
    onActiveCaseChange(nextCases[0].id);
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#1f1f1f]">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#303030] px-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[#cfcfcf]">
          <span className="text-[#2db55d]">☑</span>
          Testcase
        </div>
        <div className="flex gap-2">
          <Button className="h-7 px-2 text-xs" onClick={addCase} variant="ghost">
            + Case
          </Button>
          <Button className="h-7 px-2 text-xs" disabled={testCases.length <= 1} onClick={removeActiveCase} variant="ghost">
            Delete
          </Button>
        </div>
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

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <label className="mb-2 block text-xs font-semibold text-[#a8a8a8]">Input</label>
        <textarea
          className="mb-4 min-h-24 w-full resize-y rounded-lg border border-[#303030] bg-[#2b2b2b] p-3 font-mono text-sm text-[#f1f1f1] focus:border-[#555]"
          value={activeCase.input}
          onChange={(event) => updateActiveCase({ input: event.target.value })}
          spellCheck={false}
        />

        <label className="mb-2 block text-xs font-semibold text-[#a8a8a8]">Expected</label>
        <textarea
          className="min-h-20 w-full resize-y rounded-lg border border-[#303030] bg-[#2b2b2b] p-3 font-mono text-sm text-[#f1f1f1] focus:border-[#555]"
          value={activeCase.expected}
          onChange={(event) => updateActiveCase({ expected: event.target.value })}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
