import type { Problem, RunResult, TestCase } from "@/entities/problem/model/types";
import { SolutionEditor } from "@/features/problem-editor/ui/SolutionEditor";
import { TestcaseEditor } from "@/features/testcases/ui/TestcaseEditor";
import { TestResultPanel } from "@/widgets/test-result-panel/ui/TestResultPanel";
import { Button } from "@/shared/ui/button";

type BottomTab = "testcase" | "result";

export function CodeWorkspace({
  problem,
  result,
  bottomTab,
  activeCaseId,
  editorResetKey,
  onBottomTabChange,
  onActiveCaseChange,
  onProblemChange,
  onCodeChange,
  onCodeDraftChange,
  onRunCurrent,
  onRunAll,
}: {
  problem: Problem;
  result: RunResult | null;
  bottomTab: BottomTab;
  activeCaseId?: string;
  editorResetKey: number;
  onBottomTabChange: (tab: BottomTab) => void;
  onActiveCaseChange: (id: string) => void;
  onProblemChange: (problem: Problem) => void;
  onCodeChange: (problemId: string, code: string) => void;
  onCodeDraftChange: (problemId: string, code: string) => void;
  onRunCurrent: () => void;
  onRunAll: () => void;
}) {
  function updateTestCases(testCases: TestCase[]) {
    onProblemChange({ ...problem, testCases });
  }

  return (
    <section className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_minmax(270px,42%)] gap-2">
      <div className="min-h-0 overflow-hidden rounded-lg border border-[#303030] bg-[#1f1f1f]">
        <div className="flex h-11 items-center justify-between border-b border-[#303030] bg-[#252525] px-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[#cfcfcf]">
            <span className="text-[#2db55d]">&lt;/&gt;</span>
            Code
          </div>
        </div>
        <div className="h-[calc(100%-44px)]">
          <SolutionEditor
            initialCode={problem.code}
            problemId={problem.id}
            resetKey={editorResetKey}
            onRun={onRunCurrent}
            onDraftChange={onCodeDraftChange}
            onChange={onCodeChange}
          />
        </div>
      </div>

      <div className="min-h-0 overflow-hidden rounded-lg border border-[#303030] bg-[#1f1f1f]">
        <div className="flex h-11 items-center justify-between border-b border-[#303030] bg-[#252525] px-3">
          <div className="flex items-center gap-2">
            <Button
              className="h-7 px-2 text-xs"
              onClick={() => onBottomTabChange("testcase")}
              variant={bottomTab === "testcase" ? "default" : "ghost"}
            >
              Testcase
            </Button>
            <Button
              className="h-7 px-2 text-xs"
              onClick={() => onBottomTabChange("result")}
              variant={bottomTab === "result" ? "default" : "ghost"}
            >
              Test Result
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button className="h-7 px-2 text-xs" variant="secondary" onClick={onRunCurrent}>
              Run Case
            </Button>
            <Button className="h-7 px-2 text-xs" variant="secondary" onClick={onRunAll}>
              Run All
            </Button>
          </div>
        </div>
        <div className="h-[calc(100%-44px)]">
          {bottomTab === "testcase" ? (
            <TestcaseEditor
              activeCaseId={activeCaseId}
              testCases={problem.testCases}
              onActiveCaseChange={onActiveCaseChange}
              onChange={updateTestCases}
            />
          ) : (
            <TestResultPanel
              activeCaseId={activeCaseId}
              result={result}
              testCases={problem.testCases}
              onActiveCaseChange={onActiveCaseChange}
            />
          )}
        </div>
      </div>
    </section>
  );
}
