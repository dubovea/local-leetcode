import type { RunRequest, RunResult } from "@/entities/problem/model/types";

const TIMEOUT_MS = 3000;

export function runInWorker(request: RunRequest): Promise<RunResult> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL("../workers/codeRunner.worker.ts", import.meta.url), {
      type: "module",
    });

    const timeoutId = window.setTimeout(() => {
      worker.terminate();
      resolve({
        ok: false,
        status: "timeout",
        durationMs: TIMEOUT_MS,
        passedCount: 0,
        totalCount: request.testCases.length,
        cases: [],
        logs: [],
        errorText: `Execution stopped after ${TIMEOUT_MS} ms`,
      });
    }, TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<RunResult>) => {
      window.clearTimeout(timeoutId);
      worker.terminate();
      resolve(event.data);
    };

    worker.onerror = (event) => {
      window.clearTimeout(timeoutId);
      worker.terminate();
      resolve({
        ok: false,
        status: "runtime-error",
        durationMs: 0,
        passedCount: 0,
        totalCount: request.testCases.length,
        cases: [],
        logs: [],
        errorText: event.message,
      });
    };

    worker.postMessage(request);
  });
}
