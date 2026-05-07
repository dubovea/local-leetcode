import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Problem,
  ProblemsBackup,
  RunResult,
  RunStatus,
  Submission,
} from "@/entities/problem/model/types";
import { useProblemStore } from "@/entities/problem/model/problemStore";
import { runInWorker } from "@/features/problem-runner/model/runInWorker";
import { createId } from "@/shared/lib/id";
import { TopBar } from "@/widgets/top-bar/ui/TopBar";
import { ProblemListDrawer } from "@/widgets/problem-list-drawer/ui/ProblemListDrawer";
import { ProblemDescriptionPanel } from "@/widgets/problem-description/ui/ProblemDescriptionPanel";
import { CodeWorkspace } from "@/widgets/code-workspace/ui/CodeWorkspace";

type BottomTab = "testcase" | "result";
type AppTheme = "dark" | "light";

const THEME_STORAGE_KEY = "local-leetcode:theme";

function getInitialTheme(): AppTheme {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  return storedTheme === "light" ? "light" : "dark";
}

function resultToSubmission(result: RunResult, code: string): Submission {
  const status = result.status as Exclude<RunStatus, "idle" | "running">;

  return {
    id: createId("submission"),
    submittedAt: new Date().toISOString(),
    status,
    runtimeMs: result.durationMs,
    code,
    cases: result.cases,
    logs: result.logs,
    errorText: result.errorText,
  };
}

export function ProblemPage() {
  const activeProblem = useProblemStore((state) => state.activeProblem);
  const activeProblemId = useProblemStore((state) => state.activeProblemId);
  const addManualProblem = useProblemStore((state) => state.addManualProblem);
  const addSubmission = useProblemStore((state) => state.addSubmission);
  const deleteSubmission = useProblemStore((state) => state.deleteSubmission);
  const errorText = useProblemStore((state) => state.errorText);
  const exportBackup = useProblemStore((state) => state.exportBackup);
  const hydrated = useProblemStore((state) => state.hydrated);
  const importBackup = useProblemStore((state) => state.importBackup);
  const importProblems = useProblemStore((state) => state.importProblems);
  const initialize = useProblemStore((state) => state.initialize);
  const problemIndex = useProblemStore((state) => state.problemIndex);
  const resetProblems = useProblemStore((state) => state.resetProblems);
  const restoreSubmissionCode = useProblemStore((state) => state.restoreSubmissionCode);
  const saveProblemCode = useProblemStore((state) => state.saveProblemCode);
  const selectProblem = useProblemStore((state) => state.selectProblem);
  const updateActiveProblem = useProblemStore((state) => state.updateActiveProblem);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [bottomTab, setBottomTab] = useState<BottomTab>("testcase");
  const [activeCaseId, setActiveCaseId] = useState<string | undefined>();
  const [lastResult, setLastResult] = useState<RunResult | null>(null);
  const [editorResetKey, setEditorResetKey] = useState(0);
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme);
  const latestCodeRef = useRef("");

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!activeProblem) {
      return;
    }

    latestCodeRef.current = activeProblem.code;
    setActiveCaseId(activeProblem.testCases[0]?.id);
    setLastResult(null);
    setBottomTab("testcase");
  }, [activeProblem?.id]);

  const execute = useCallback(
    async (saveSubmission: boolean) => {
      if (!activeProblem || running) {
        return;
      }

      const code = latestCodeRef.current || activeProblem.code;
      const testCases = activeProblem.testCases;

      if (testCases.length === 0) {
        return;
      }

      setRunning(true);
      setBottomTab("result");

      const result = await runInWorker({
        code,
        functionName: activeProblem.functionName,
        judgeMode: activeProblem.judgeMode,
        testCases,
      });

      setLastResult(result);

      if (saveSubmission) {
        await addSubmission(activeProblem.id, resultToSubmission(result, code), code);
      } else {
        void saveProblemCode(activeProblem.id, code);
      }

      setRunning(false);
    },
    [activeProblem, addSubmission, running, saveProblemCode],
  );

  async function handleSelectProblem(problemId: string) {
    await selectProblem(problemId);
    setDrawerOpen(false);
  }

  function handleCodeDraftChange(problemId: string, code: string) {
    if (problemId === activeProblemId) {
      latestCodeRef.current = code;
    }
  }

  async function handleCodeChange(problemId: string, code: string) {
    await saveProblemCode(problemId, code);
  }

  async function handleRestoreSubmission(submissionId: string) {
    if (!activeProblem) {
      return;
    }

    const restoredCode = await restoreSubmissionCode(activeProblem.id, submissionId);

    if (restoredCode === null) {
      return;
    }

    latestCodeRef.current = restoredCode;
    setEditorResetKey((value) => value + 1);
  }

  async function handleDeleteSubmission(submissionId: string) {
    if (!activeProblem) {
      return;
    }

    await deleteSubmission(activeProblem.id, submissionId);
  }

  async function handleProblemChange(problem: Problem) {
    const code =
      problem.id === activeProblemId ? latestCodeRef.current || problem.code : problem.code;
    await updateActiveProblem({ ...problem, code });
  }

  async function handleImportBackup(backup: ProblemsBackup | Problem[]) {
    await importBackup(backup);
    setDrawerOpen(false);
  }

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--lc-page)] text-sm text-[var(--lc-muted)]">
        Loading local problems...
      </div>
    );
  }

  if (errorText) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--lc-page)] p-6 text-sm text-[var(--lc-danger-text)]">
        {errorText}
      </div>
    );
  }

  if (!activeProblem || !activeProblemId) {
    return null;
  }

  return (
    <div className="flex h-screen min-h-0 flex-col bg-[var(--lc-page)] text-[var(--lc-text)]">
      <TopBar
        theme={theme}
        running={running}
        onOpenProblemList={() => setDrawerOpen(true)}
        onPlay={() => void execute(false)}
        onSubmit={() => void execute(true)}
        onThemeToggle={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
      />

      <ProblemListDrawer
        activeProblemId={activeProblemId}
        open={drawerOpen}
        problemIndex={problemIndex}
        onClose={() => setDrawerOpen(false)}
        onSelect={(problemId) => void handleSelectProblem(problemId)}
        onCreateManual={(problem) => {
          void addManualProblem(problem);
          setDrawerOpen(false);
        }}
        onImportProblems={(problems) => void importProblems(problems)}
        onExportBackup={exportBackup}
        onImportBackup={handleImportBackup}
        onResetProblems={() => void resetProblems()}
      />

      <main className="grid min-h-0 flex-1 grid-cols-[46%_54%] gap-2 p-2">
        <ProblemDescriptionPanel
          problem={activeProblem}
          onChange={(problem) => void handleProblemChange(problem)}
          onRestoreSubmission={(submissionId) => void handleRestoreSubmission(submissionId)}
          onDeleteSubmission={(submissionId) => void handleDeleteSubmission(submissionId)}
        />
        <CodeWorkspace
          activeCaseId={activeCaseId}
          bottomTab={bottomTab}
          editorResetKey={editorResetKey}
          problem={activeProblem}
          result={lastResult}
          theme={theme}
          onActiveCaseChange={setActiveCaseId}
          onBottomTabChange={setBottomTab}
          onProblemChange={(problem) => void handleProblemChange(problem)}
          onCodeDraftChange={handleCodeDraftChange}
          onCodeChange={(problemId, code) => void handleCodeChange(problemId, code)}
          onRun={() => void execute(false)}
        />
      </main>
    </div>
  );
}
