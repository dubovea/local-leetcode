import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CodeLanguage,
  Problem,
  ProblemsBackup,
  RunResult,
  RunStatus,
  Submission,
} from "@/entities/problem/model/types";
import { useProblemStore } from "@/entities/problem/model/problemStore";
import { DEFAULT_CODE_LANGUAGE, getProblemCode } from "@/entities/problem/model/codeLanguages";
import { runInWorker } from "@/features/problem-runner/model/runInWorker";
import { createId } from "@/shared/lib/id";
import { Button } from "@/shared/ui/button";
import { TopBar } from "@/widgets/top-bar/ui/TopBar";
import { ProblemListDrawer } from "@/widgets/problem-list-drawer/ui/ProblemListDrawer";
import { ProblemDescriptionPanel } from "@/widgets/problem-description/ui/ProblemDescriptionPanel";
import { CodeWorkspace } from "@/widgets/code-workspace/ui/CodeWorkspace";

type BottomTab = "testcase" | "result";
type AppTheme = "dark" | "light";

const THEME_STORAGE_KEY = "medikcode:theme";

function getInitialTheme(): AppTheme {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  return storedTheme === "light" ? "light" : "dark";
}

function resultToSubmission(result: RunResult, code: string, language: CodeLanguage): Submission {
  const status = result.status as Exclude<RunStatus, "idle" | "running">;

  return {
    id: createId("submission"),
    submittedAt: new Date().toISOString(),
    language,
    status,
    runtimeMs: result.durationMs,
    memoryBytes: status === "accepted" ? result.memoryBytes : undefined,
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
  const deleteProblem = useProblemStore((state) => state.deleteProblem);
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
  const [activeLanguage, setActiveLanguage] = useState<CodeLanguage>(DEFAULT_CODE_LANGUAGE);
  const latestCodeByLanguageRef = useRef<Partial<Record<CodeLanguage, string>>>({});

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

    const nextLanguage = activeProblem.activeLanguage ?? DEFAULT_CODE_LANGUAGE;

    latestCodeByLanguageRef.current = {
      ...(activeProblem.codeByLanguage ?? {}),
      [DEFAULT_CODE_LANGUAGE]:
        activeProblem.codeByLanguage?.[DEFAULT_CODE_LANGUAGE] ?? activeProblem.code,
      [nextLanguage]: getProblemCode(activeProblem, nextLanguage),
    };
    setActiveLanguage(nextLanguage);
    setActiveCaseId(activeProblem.testCases[0]?.id);
    setLastResult(null);
    setBottomTab("testcase");
  }, [activeProblem?.id]);

  const execute = useCallback(
    async (saveSubmission: boolean) => {
      if (!activeProblem || running) {
        return;
      }

      const code =
        latestCodeByLanguageRef.current[activeLanguage] ??
        getProblemCode(activeProblem, activeLanguage);
      const testCases = activeProblem.testCases;

      if (testCases.length === 0) {
        return;
      }

      setRunning(true);
      setBottomTab("result");

      const result = await runInWorker({
        code,
        language: activeLanguage,
        functionName: activeProblem.functionName,
        judgeMode: activeProblem.judgeMode,
        testCases,
      });

      setLastResult(result);

      if (saveSubmission) {
        await addSubmission(
          activeProblem.id,
          resultToSubmission(result, code, activeLanguage),
          code,
        );
      } else {
        void saveProblemCode(activeProblem.id, activeLanguage, code);
      }

      setRunning(false);
    },
    [activeLanguage, activeProblem, addSubmission, running, saveProblemCode],
  );

  async function handleSelectProblem(problemId: string) {
    await selectProblem(problemId);
    setDrawerOpen(false);
  }

  function handleCodeDraftChange(problemId: string, language: CodeLanguage, code: string) {
    if (problemId === activeProblemId) {
      latestCodeByLanguageRef.current = {
        ...latestCodeByLanguageRef.current,
        [language]: code,
      };
    }
  }

  async function handleCodeChange(problemId: string, language: CodeLanguage, code: string) {
    await saveProblemCode(problemId, language, code);
  }

  async function handleLanguageChange(language: CodeLanguage) {
    if (!activeProblem || language === activeLanguage) {
      return;
    }

    const currentCode =
      latestCodeByLanguageRef.current[activeLanguage] ??
      getProblemCode(activeProblem, activeLanguage);
    const nextCode =
      latestCodeByLanguageRef.current[language] ?? getProblemCode(activeProblem, language);
    const codeByLanguage = {
      ...(activeProblem.codeByLanguage ?? {}),
      ...latestCodeByLanguageRef.current,
      [activeLanguage]: currentCode,
      [language]: nextCode,
    };

    latestCodeByLanguageRef.current = codeByLanguage;
    setActiveLanguage(language);
    setLastResult(null);
    setEditorResetKey((value) => value + 1);

    await updateActiveProblem({
      ...activeProblem,
      activeLanguage: language,
      code: nextCode,
      codeByLanguage,
    });
  }

  async function handleRestoreSubmission(submissionId: string) {
    if (!activeProblem) {
      return;
    }

    const restored = await restoreSubmissionCode(activeProblem.id, submissionId);

    if (restored === null) {
      return;
    }

    latestCodeByLanguageRef.current = {
      ...latestCodeByLanguageRef.current,
      [restored.language]: restored.code,
    };
    setActiveLanguage(restored.language);
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
      problem.id === activeProblemId
        ? (latestCodeByLanguageRef.current[activeLanguage] ??
          getProblemCode(problem, activeLanguage))
        : problem.code;
    const codeByLanguage =
      problem.id === activeProblemId
        ? {
            ...(problem.codeByLanguage ?? {}),
            ...latestCodeByLanguageRef.current,
            [activeLanguage]: code,
          }
        : problem.codeByLanguage;

    await updateActiveProblem({
      ...problem,
      activeLanguage: problem.id === activeProblemId ? activeLanguage : problem.activeLanguage,
      code,
      codeByLanguage,
    });
  }

  async function handleImportBackup(backup: ProblemsBackup | Problem[]) {
    await importBackup(backup);
    setDrawerOpen(false);
  }

  const handleDescriptionChange = useCallback(
    (problem: Problem) => {
      void handleProblemChange(problem);
    },
    [handleProblemChange],
  );

  const handleDescriptionSelectProblem = useCallback(
    (problemId: string) => {
      void handleSelectProblem(problemId);
    },
    [handleSelectProblem],
  );

  const handleDescriptionRestoreSubmission = useCallback(
    (submissionId: string) => {
      void handleRestoreSubmission(submissionId);
    },
    [handleRestoreSubmission],
  );

  const handleDescriptionDeleteSubmission = useCallback(
    (submissionId: string) => {
      void handleDeleteSubmission(submissionId);
    },
    [handleDeleteSubmission],
  );

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
    return (
      <div className="flex h-screen min-h-0 flex-col bg-[var(--lc-page)] text-[var(--lc-text)]">
        <TopBar
          actionsDisabled
          theme={theme}
          running={running}
          onOpenProblemList={() => setDrawerOpen(true)}
          onPlay={() => undefined}
          onSubmit={() => undefined}
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
          onDeleteProblem={(problemId) => void deleteProblem(problemId)}
        />

        <main className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-sm text-center">
            <h1 className="mb-2 text-xl font-semibold text-[var(--lc-text-strong)]">
              No problems yet
            </h1>
            <p className="mb-4 text-sm text-[var(--lc-muted)]">
              Create a manual problem or import a backup to continue.
            </p>
            <Button onClick={() => setDrawerOpen(true)}>Open problems</Button>
          </div>
        </main>
      </div>
    );
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
        onDeleteProblem={(problemId) => void deleteProblem(problemId)}
      />

      <main className="grid min-h-0 flex-1 grid-cols-[46%_54%] gap-2 p-2">
        <ProblemDescriptionPanel
          problem={activeProblem}
          problemIndex={problemIndex}
          onChange={handleDescriptionChange}
          onSelectProblem={handleDescriptionSelectProblem}
          onRestoreSubmission={handleDescriptionRestoreSubmission}
          onDeleteSubmission={handleDescriptionDeleteSubmission}
        />
        <CodeWorkspace
          activeCaseId={activeCaseId}
          bottomTab={bottomTab}
          code={
            latestCodeByLanguageRef.current[activeLanguage] ??
            getProblemCode(activeProblem, activeLanguage)
          }
          editorResetKey={editorResetKey}
          language={activeLanguage}
          problem={activeProblem}
          result={lastResult}
          theme={theme}
          onActiveCaseChange={setActiveCaseId}
          onBottomTabChange={setBottomTab}
          onLanguageChange={(language) => void handleLanguageChange(language)}
          onProblemChange={(problem) => void handleProblemChange(problem)}
          onCodeDraftChange={handleCodeDraftChange}
          onCodeChange={(problemId, language, code) =>
            void handleCodeChange(problemId, language, code)
          }
          onRun={() => void execute(false)}
        />
      </main>
    </div>
  );
}
