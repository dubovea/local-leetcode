import { cleanValueText, evaluateLiteral, parseInputAssignments } from "./runnerInput.js";
import { maxCaseMemoryBytes, measureMemoryBytes, nowMs, readMemoryBytes } from "./runnerMetrics.js";
import { compareValues, createConsole, formatError, stringifyValue } from "./runnerValue.js";
import { compileUserCode, executeDesignCase } from "./runnerJavaScript.js";
import {
  getPythonCallPlan,
  getPythonTypeHints,
  getStructuredKind,
  transformInputJS,
  transformOutputJS,
} from "./runnerTypeTransforms.js";
import {
  compilePythonCode,
  destroyPyProxy,
  pythonValueToJs,
  setPythonLogsTarget,
} from "./runnerPython.js";

const DEFAULT_LANGUAGE = "javascript";

export { parseInputAssignments };

function unsupportedWasmLanguageResult(request) {
  return {
    ok: false,
    status: "runtime-error",
    durationMs: 0,
    passedCount: 0,
    totalCount: request.testCases.length,
    cases: [],
    logs: [],
    errorText:
      "Запуск C/C#/C++/Go исходников через WASM требует отдельного compiler/runtime sandbox. Сейчас код для этих языков сохраняется и подсвечивается, но исполняемые метрики доступны только для JavaScript и Python (Pyodide).",
  };
}

function readDesignCase(parsedInput) {
  const operationsIndex = parsedInput.names.findIndex((name) =>
    ["operations", "methods", "actions"].includes(name),
  );
  const argumentsIndex = parsedInput.names.findIndex((name) =>
    ["arguments", "args", "params"].includes(name),
  );
  const operations =
    operationsIndex >= 0 ? parsedInput.values[operationsIndex] : parsedInput.values[0];
  const args = argumentsIndex >= 0 ? parsedInput.values[argumentsIndex] : parsedInput.values[1];

  if (
    Array.isArray(operations) &&
    operations.every((operation) => typeof operation === "string") &&
    Array.isArray(args)
  ) {
    return { operations, args };
  }

  return null;
}

function createCompileErrorResult(error, totalStartedAt, totalCount, cases, logs) {
  return {
    ok: false,
    status: "runtime-error",
    durationMs: nowMs() - totalStartedAt,
    passedCount: 0,
    totalCount,
    cases,
    logs,
    errorText: formatError(error),
  };
}

function buildRunResult(cases, logs, totalCount) {
  const passedCount = cases.filter((testCase) => testCase.passed).length;
  const hasRuntimeError = cases.some((testCase) => testCase.errorText);
  const ok = passedCount === totalCount;

  return {
    ok,
    status: ok ? "accepted" : hasRuntimeError ? "runtime-error" : "wrong-answer",
    durationMs: cases.reduce((total, testCase) => total + testCase.durationMs, 0),
    memoryBytes: ok ? maxCaseMemoryBytes(cases) : undefined,
    passedCount,
    totalCount,
    cases,
    logs,
  };
}

async function runJavaScriptUserCode(request) {
  const logs = [];
  const totalStartedAt = nowMs();
  const consoleApi = createConsole(logs);
  const cases = [];

  let compiled;

  try {
    compiled = compileUserCode(request.code, request.functionName, consoleApi);
  } catch (error) {
    return createCompileErrorResult(error, totalStartedAt, request.testCases.length, cases, logs);
  }

  for (let index = 0; index < request.testCases.length; index += 1) {
    const testCase = request.testCases[index];
    let durationMs = 0;
    let solutionStartedAt;

    try {
      const parsedInput = parseInputAssignments(testCase.input);
      const expected = evaluateLiteral(testCase.expected);
      const designCase = readDesignCase(parsedInput);
      const transformedInput = transformInputJS(
        parsedInput.values,
        request.code,
        parsedInput.names,
      );
      const memoryStartedBytes = await readMemoryBytes();
      compiled.memoryTracker.reset();
      solutionStartedAt = nowMs();
      const output = designCase
        ? executeDesignCase(compiled.solution, designCase, request.code)
        : await compiled.solution(...transformedInput);
      durationMs = nowMs() - solutionStartedAt;

      const normalizedOutput = designCase
        ? output
        : transformOutputJS(output, request.code, transformedInput[0]);
      const memoryBytes = await measureMemoryBytes(
        memoryStartedBytes,
        normalizedOutput,
        [parsedInput.values, transformedInput, output],
        compiled.memoryTracker.readBytes(),
      );
      const passed = compareValues(normalizedOutput, expected, request.judgeMode);
      cases.push({
        id: testCase.id,
        name: `Case ${index + 1}`,
        passed,
        durationMs,
        memoryBytes,
        inputText: testCase.input,
        outputText: stringifyValue(normalizedOutput),
        expectedText: stringifyValue(expected),
      });
    } catch (error) {
      if (typeof solutionStartedAt === "number") {
        durationMs = nowMs() - solutionStartedAt;
      }

      cases.push({
        id: testCase.id,
        name: `Case ${index + 1}`,
        passed: false,
        durationMs,
        inputText: testCase.input,
        outputText: "",
        expectedText: cleanValueText(testCase.expected),
        errorText: formatError(error),
      });
    }
  }

  return buildRunResult(cases, logs, request.testCases.length);
}

async function runPythonUserCode(request) {
  const logs = [];
  const totalStartedAt = nowMs();
  const cases = [];

  let compiled;

  setPythonLogsTarget(logs);

  try {
    compiled = await compilePythonCode(request.code, request.functionName);
  } catch (error) {
    setPythonLogsTarget(null);
    return createCompileErrorResult(error, totalStartedAt, request.testCases.length, cases, logs);
  }

  try {
    for (let index = 0; index < request.testCases.length; index += 1) {
      const testCase = request.testCases[index];
      let durationMs = 0;
      let solutionStartedAt;
      let outputProxy;
      let serializedOutputProxy;
      const args = [];
      const rawArgProxies = [];

      try {
        const parsedInput = parseInputAssignments(testCase.input);
        const expected = evaluateLiteral(testCase.expected);
        const callPlan = getPythonCallPlan(request.code, request.functionName, parsedInput);
        const returnKind = getStructuredKind(
          getPythonTypeHints(request.code, request.functionName).returnType,
          request.code,
        );

        for (const item of callPlan) {
          const rawArg = compiled.pyodide.toPy(item.value);
          rawArgProxies.push(rawArg);
          args.push(item.kind ? compiled.transformValue(rawArg, item.kind) : rawArg);
        }

        const memoryStartedBytes = await readMemoryBytes();
        solutionStartedAt = nowMs();
        outputProxy = compiled.solution(...args);
        durationMs = nowMs() - solutionStartedAt;

        serializedOutputProxy = returnKind
          ? compiled.serializeValue(outputProxy, returnKind)
          : outputProxy;
        const output = pythonValueToJs(serializedOutputProxy);
        const memoryBytes = await measureMemoryBytes(memoryStartedBytes, output, [
          parsedInput.values,
          output,
        ]);
        const passed = compareValues(output, expected, request.judgeMode);

        cases.push({
          id: testCase.id,
          name: `Case ${index + 1}`,
          passed,
          durationMs,
          memoryBytes,
          inputText: testCase.input,
          outputText: stringifyValue(output),
          expectedText: stringifyValue(expected),
        });
      } catch (error) {
        if (typeof solutionStartedAt === "number") {
          durationMs = nowMs() - solutionStartedAt;
        }

        cases.push({
          id: testCase.id,
          name: `Case ${index + 1}`,
          passed: false,
          durationMs,
          inputText: testCase.input,
          outputText: "",
          expectedText: cleanValueText(testCase.expected),
          errorText: formatError(error),
        });
      } finally {
        if (serializedOutputProxy !== outputProxy) {
          destroyPyProxy(serializedOutputProxy);
        }
        destroyPyProxy(outputProxy);

        for (const arg of args) {
          destroyPyProxy(arg);
        }

        for (const arg of rawArgProxies) {
          if (!args.includes(arg)) {
            destroyPyProxy(arg);
          }
        }
      }
    }
  } finally {
    setPythonLogsTarget(null);
    destroyPyProxy(compiled.serializeValue);
    destroyPyProxy(compiled.transformValue);
    destroyPyProxy(compiled.solution);
    destroyPyProxy(compiled.globals);
  }

  return buildRunResult(cases, logs, request.testCases.length);
}

export async function runUserCode(request) {
  const language = request.language ?? DEFAULT_LANGUAGE;

  if (language === "python-pyodide") {
    return runPythonUserCode(request);
  }

  if (language !== DEFAULT_LANGUAGE) {
    return unsupportedWasmLanguageResult(request);
  }

  return runJavaScriptUserCode(request);
}
