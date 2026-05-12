import { CheckSquare, Code2, FileText } from "lucide-react";
import type { CodeLanguage, Problem, RunResult, TestCase } from "@/entities/problem/model/types";
import { codeLanguageOptions } from "@/entities/problem/model/codeLanguages";
import { SolutionEditor } from "@/features/problem-editor/ui/SolutionEditor";
import { TestcaseEditor } from "@/features/testcases/ui/TestcaseEditor";
import { TestResultPanel } from "@/widgets/test-result-panel/ui/TestResultPanel";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

type BottomTab = "testcase" | "result";
type AppTheme = "dark" | "light";

export function CodeWorkspace({
  problem,
  code,
  language,
  result,
  bottomTab,
  activeCaseId,
  editorResetKey,
  theme,
  onBottomTabChange,
  onActiveCaseChange,
  onLanguageChange,
  onProblemChange,
  onCodeChange,
  onCodeDraftChange,
  onRun,
}: {
  problem: Problem;
  code: string;
  language: CodeLanguage;
  result: RunResult | null;
  bottomTab: BottomTab;
  activeCaseId?: string;
  editorResetKey: number;
  theme: AppTheme;
  onBottomTabChange: (tab: BottomTab) => void;
  onActiveCaseChange: (id: string) => void;
  onLanguageChange: (language: CodeLanguage) => void;
  onProblemChange: (problem: Problem) => void;
  onCodeChange: (problemId: string, language: CodeLanguage, code: string) => void;
  onCodeDraftChange: (problemId: string, language: CodeLanguage, code: string) => void;
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
          <Select
            value={language}
            onValueChange={(value) => onLanguageChange(value as CodeLanguage)}
          >
            <SelectTrigger
              aria-label="Code language"
              className="h-8 w-44 border-[var(--lc-border)] bg-[var(--lc-panel)] text-xs text-[var(--lc-text-strong)]"
              title="Code language"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[var(--lc-panel-raised)]">
              {codeLanguageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="h-[calc(100%-44px)]">
          <SolutionEditor
            initialCode={code}
            language={language}
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
          <Tabs value={bottomTab} onValueChange={(value) => onBottomTabChange(value as BottomTab)}>
            <TabsList className="h-8 bg-transparent p-0" variant="line">
              <TabsTrigger
                className="h-8 rounded-md px-3 text-xs text-[var(--lc-muted)] data-active:bg-[var(--lc-active)] data-active:text-[var(--lc-text-strong)]"
                value="testcase"
              >
                <CheckSquare className="h-4 w-4" />
                Testcase
              </TabsTrigger>
              <TabsTrigger
                className="h-8 rounded-md px-3 text-xs text-[var(--lc-muted)] data-active:bg-[var(--lc-active)] data-active:text-[var(--lc-text-strong)]"
                value="result"
              >
                <FileText className="h-4 w-4" />
                Test Result
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
