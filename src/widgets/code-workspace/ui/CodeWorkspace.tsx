import { CheckSquare, Code2, FileText } from "lucide-react";
import type { Problem, RunResult, TestCase } from "@/entities/problem/model/types";
import { SolutionEditor } from "@/features/problem-editor/ui/SolutionEditor";
import { TestcaseEditor } from "@/features/testcases/ui/TestcaseEditor";
import { TestResultPanel } from "@/widgets/test-result-panel/ui/TestResultPanel";
import { Button } from "@/shared/ui/button";

type BottomTab = "testcase" | "result";
type AppTheme = "dark" | "light";

export function CodeWorkspace({
  problem,
  result,
  bottomTab,
  activeCaseId,
  editorResetKey,
  theme,
  onBottomTabChange,
  onActiveCaseChange,
  onProblemChange,
  onCodeChange,
  onCodeDraftChange,
  onRun,
}: {
  problem: Problem;
  result: RunResult | null;
  bottomTab: BottomTab;
  activeCaseId?: string;
  editorResetKey: number;
  theme: AppTheme;
  onBottomTabChange: (tab: BottomTab) => void;
  onActiveCaseChange: (id: string) => void;
  onProblemChange: (problem: Problem) => void;
  onCodeChange: (problemId: string, code: string) => void;
  onCodeDraftChange: (problemId: string, code: string) => void;
  onRun: () => void;
}) {
  function updateTestCases(testCases: TestCase[]) {
    onProblemChange({ ...problem, testCases });
  }

  return (
    <section className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_minmax(270px,42%)] gap-2">
      <div className="min-h-0 overflow-hidden rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel)]">
        <div className="flex h-11 items-center justify-between border-b border-[var(--lc-border)] bg-[var(--lc-panel-header)] px-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--lc-text)]">
            <Code2 className="h-4 w-4 text-[var(--lc-success)]" />
            Code
          </div>
        </div>
        <div className="h-[calc(100%-44px)]">
          <SolutionEditor
            initialCode={problem.code}
            problemId={problem.id}
            resetKey={editorResetKey}
            theme={theme}
            onRun={onRun}
            onDraftChange={onCodeDraftChange}
            onChange={onCodeChange}
          />
        </div>
      </div>

      <div className="min-h-0 overflow-hidden rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel)]">
        <div className="flex h-11 items-center justify-between border-b border-[var(--lc-border)] bg-[var(--lc-panel-header)] px-3">
          <div className="flex items-center gap-2">
            <Button
              className="h-7 px-2 text-xs"
              onClick={() => onBottomTabChange("testcase")}
              variant={bottomTab === "testcase" ? "default" : "ghost"}
            >
              <CheckSquare className="h-4 w-4" />
              Testcase
            </Button>
            <Button
              className="h-7 px-2 text-xs"
              onClick={() => onBottomTabChange("result")}
              variant={bottomTab === "result" ? "default" : "ghost"}
            >
              <FileText className="h-4 w-4" />
              Test Result
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
