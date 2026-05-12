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
const PERFORMANCE_NOTICE_STORAGE_KEY = "medikcode:v1:performance-notice-hidden";

function getInitialTheme(): AppTheme {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  return storedTheme === "light" ? "light" : "dark";
}

function getInitialPerformanceNoticeOpen() {
  return localStorage.getItem(PERFORMANCE_NOTICE_STORAGE_KEY) !== "true";
}

function PerformanceNoticeDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: (hidePermanently: boolean) => void;
}) {
  const [hidePermanently, setHidePermanently] = useState(false);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-xl rounded-xl border border-[var(--lc-border)] bg-[var(--lc-panel-raised)] p-5 shadow-2xl">
        <div className="mb-3 text-lg font-semibold text-[var(--lc-text-strong)]">
          Измерения производительности
        </div>
        <div className="space-y-3 text-sm leading-6 text-[var(--lc-text)]">
          <p>
            JavaScript запускается в браузерном Web Worker. Таймер оборачивает только вызов
            пользовательской функции, конструктора или метода; парсинг входных данных и сравнение
            ответа не входят в runtime. На очень коротких тестах погрешность обычно около 0.1-2 мс,
            иногда до 5 мс из-за планировщика браузера и сборщика мусора.
          </p>
          <p>
            Python работает через Pyodide/WebAssembly. По сравнению с нативным CPython время часто
            отличается примерно в 2-10 раз, а память может быть выше на 20-80 МБ из-за runtime
            Pyodide. Для C/C#/C++/Go после подключения compiler/runtime sandbox WASM обычно даёт
            около +10-100% ко времени для C/C++, около +50-300% для Go/C# runtime-задач и примерно
            +1-80 МБ к памяти из-за linear memory, runtime и glue-кода.
          </p>
          <p>
            Память считается приблизительно: сначала используются доступные browser memory API,
            затем fallback по размеру удерживаемого результата. Значения могут отличаться от
            LeetCode на десятки процентов, а для маленьких решений - на десятки мегабайт, потому что
            браузер, Worker, JIT/WASM runtime и состояние вкладки тоже влияют на замер.
          </p>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-[var(--lc-muted)]">
          <input
            checked={hidePermanently}
            className="h-4 w-4"
            type="checkbox"
            onChange={(event) => setHidePermanently(event.target.checked)}
          />
          Больше не показывать
        </label>

        <div className="mt-5 flex justify-end">
          <Button onClick={() => onClose(hidePermanently)}>Понятно</Button>
        </div>
      </div>
    </div>
  );
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
  const [performanceNoticeOpen, setPerformanceNoticeOpen] = useState(
    getInitialPerformanceNoticeOpen,
  );
  const latestCodeByLanguageRef = useRef<Partial<Record<CodeLanguage, string>>>({});
  const latestCodeProblemIdRef = useRef<string | null>(null);

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

    latestCodeProblemIdRef.current = activeProblem.id;
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

  const draftMatchesActiveProblem = activeProblem
    ? latestCodeProblemIdRef.current === activeProblem.id
    : false;
  const currentLanguage =
    activeProblem && !draftMatchesActiveProblem
      ? (activeProblem.activeLanguage ?? DEFAULT_CODE_LANGUAGE)
      : activeLanguage;

  const execute = useCallback(
    async (saveSubmission: boolean) => {
      if (!activeProblem || running) {
        return;
      }

      const language = currentLanguage;
      const code =
        (draftMatchesActiveProblem ? latestCodeByLanguageRef.current[language] : undefined) ??
        getProblemCode(activeProblem, language);
      const testCases = activeProblem.testCases;

      if (testCases.length === 0) {
        return;
      }

      setRunning(true);
      setBottomTab("result");

      const result = await runInWorker({
        code,
        language,
        functionName: activeProblem.functionName,
        judgeMode: activeProblem.judgeMode,
        testCases,
      });

      setLastResult(result);

      if (saveSubmission) {
        await addSubmission(activeProblem.id, resultToSubmission(result, code, language), code);
      } else {
        void saveProblemCode(activeProblem.id, language, code);
      }

      setRunning(false);
    },
    [
      activeProblem,
      addSubmission,
      currentLanguage,
      draftMatchesActiveProblem,
      running,
      saveProblemCode,
    ],
  );

  async function handleSelectProblem(problemId: string) {
    await selectProblem(problemId);
    setDrawerOpen(false);
  }

  function handleCodeDraftChange(problemId: string, language: CodeLanguage, code: string) {
    if (problemId === activeProblemId) {
      latestCodeProblemIdRef.current = problemId;
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
    if (!activeProblem || language === currentLanguage) {
      return;
    }

    const hasActiveDraft = latestCodeProblemIdRef.current === activeProblem.id;
    const currentCode =
      (hasActiveDraft ? latestCodeByLanguageRef.current[currentLanguage] : undefined) ??
      getProblemCode(activeProblem, currentLanguage);
    const nextCode =
      (hasActiveDraft ? latestCodeByLanguageRef.current[language] : undefined) ??
      getProblemCode(activeProblem, language);
    const codeByLanguage = {
      ...(activeProblem.codeByLanguage ?? {}),
      ...(hasActiveDraft ? latestCodeByLanguageRef.current : {}),
      [currentLanguage]: currentCode,
      [language]: nextCode,
    };

    latestCodeProblemIdRef.current = activeProblem.id;
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

    latestCodeProblemIdRef.current = activeProblem.id;
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
    const isActiveProblem = problem.id === activeProblemId;
    const language = isActiveProblem
      ? currentLanguage
      : (problem.activeLanguage ?? DEFAULT_CODE_LANGUAGE);
    const hasProblemDraft = latestCodeProblemIdRef.current === problem.id;
    const code = isActiveProblem
      ? ((hasProblemDraft ? latestCodeByLanguageRef.current[language] : undefined) ??
        getProblemCode(problem, language))
      : problem.code;
    const codeByLanguage = isActiveProblem
      ? {
          ...(problem.codeByLanguage ?? {}),
          ...(hasProblemDraft ? latestCodeByLanguageRef.current : {}),
          [language]: code,
        }
      : problem.codeByLanguage;

    await updateActiveProblem({
      ...problem,
      activeLanguage: isActiveProblem ? language : problem.activeLanguage,
      code,
      codeByLanguage,
    });
  }

  async function handleImportBackup(backup: ProblemsBackup | Problem[]) {
    await importBackup(backup);
    setDrawerOpen(false);
  }

  function handleClosePerformanceNotice(hidePermanently: boolean) {
    if (hidePermanently) {
      localStorage.setItem(PERFORMANCE_NOTICE_STORAGE_KEY, "true");
    }

    setPerformanceNoticeOpen(false);
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

        <PerformanceNoticeDialog
          open={performanceNoticeOpen}
          onClose={handleClosePerformanceNotice}
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

      <PerformanceNoticeDialog
        open={performanceNoticeOpen}
        onClose={handleClosePerformanceNotice}
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
            (draftMatchesActiveProblem
              ? latestCodeByLanguageRef.current[currentLanguage]
              : undefined) ?? getProblemCode(activeProblem, currentLanguage)
          }
          editorResetKey={editorResetKey}
          language={currentLanguage}
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
