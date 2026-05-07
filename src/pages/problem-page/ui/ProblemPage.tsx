import { useCallback, useEffect, useRef, useState } from "react";
import type { RunResult, RunStatus, Submission } from "@/entities/problem/model/types";
import { useProblemStore } from "@/entities/problem/model/problemStore";
import { runInWorker } from "@/features/problem-runner/model/runInWorker";
import { createId } from "@/shared/lib/id";
import { TopBar } from "@/widgets/top-bar/ui/TopBar";
import { ProblemListDrawer } from "@/widgets/problem-list-drawer/ui/ProblemListDrawer";
import { ProblemDescriptionPanel } from "@/widgets/problem-description/ui/ProblemDescriptionPanel";
import { CodeWorkspace } from "@/widgets/code-workspace/ui/CodeWorkspace";

type BottomTab = "testcase" | "result";

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
  const errorText = useProblemStore((state) => state.errorText);
  const hydrated = useProblemStore((state) => state.hydrated);
  const importProblems = useProblemStore((state) => state.importProblems);
  const initialize = useProblemStore((state) => state.initialize);
  const problemIndex = useProblemStore((state) => state.problemIndex);
  const resetProblems = useProblemStore((state) => state.resetProblems);
  const saveProblemCode = useProblemStore((state) => state.saveProblemCode);
  const selectProblem = useProblemStore((state) => state.selectProblem);
  const updateActiveProblem = useProblemStore((state) => state.updateActiveProblem);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [bottomTab, setBottomTab] = useState<BottomTab>("testcase");
  const [activeCaseId, setActiveCaseId] = useState<string | undefined>();
  const [lastResult, setLastResult] = useState<RunResult | null>(null);
  const latestCodeRef = useRef("");

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!activeProblem) {
      return;
    }

    latestCodeRef.current = activeProblem.code;
    setActiveCaseId(activeProblem.testCases[0]?.id);
    setLastResult(null);
    setBottomTab("testcase");
  }, [activeProblem?.id]);

  const execute = useCallback(async (saveSubmission: boolean) => {
    if (!activeProblem || running) {
      return;
    }

    const code = latestCodeRef.current || activeProblem.code;

    setRunning(true);
    setBottomTab("result");

    const result = await runInWorker({
      code,
      functionName: activeProblem.functionName,
      judgeMode: activeProblem.judgeMode,
      testCases: activeProblem.testCases,
    });

    setLastResult(result);

    if (saveSubmission) {
      await addSubmission(activeProblem.id, resultToSubmission(result, code), code);
    } else {
      void saveProblemCode(activeProblem.id, code);
    }

    setRunning(false);
  }, [activeProblem, addSubmission, running, saveProblemCode]);

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

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f0f] text-sm text-[#a8a8a8]">
        Loading local problems…
      </div>
    );
  }

  if (errorText) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f0f] p-6 text-sm text-[#ff8b8b]">
        {errorText}
      </div>
    );
  }

  if (!activeProblem || !activeProblemId) {
    return null;
  }

  return (
    <div className="flex h-screen min-h-0 flex-col bg-[#0f0f0f] text-[#d4d4d4]">
      <TopBar
        running={running}
        onOpenProblemList={() => setDrawerOpen(true)}
        onRun={() => void execute(false)}
        onSubmit={() => void execute(true)}
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
        onResetProblems={() => void resetProblems()}
      />

      <main className="grid min-h-0 flex-1 grid-cols-[46%_54%] gap-2 p-2">
        <ProblemDescriptionPanel problem={activeProblem} onChange={(problem) => void updateActiveProblem(problem)} />
        <CodeWorkspace
          activeCaseId={activeCaseId}
          bottomTab={bottomTab}
          problem={activeProblem}
          result={lastResult}
          onActiveCaseChange={setActiveCaseId}
          onBottomTabChange={setBottomTab}
          onProblemChange={(problem) => void updateActiveProblem(problem)}
          onCodeDraftChange={handleCodeDraftChange}
          onCodeChange={(problemId, code) => void handleCodeChange(problemId, code)}
          onRun={() => void execute(false)}
        />
      </main>
    </div>
  );
}
