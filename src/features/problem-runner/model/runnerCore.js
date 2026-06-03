import {
  cleanValueText,
  evaluateLiteral,
  formatExpectedOutput,
  formatNamedOutput,
  parseExpectedOutput,
  parseInputAssignments,
} from "./runnerInput.js";
import { maxCaseMemoryBytes, measureMemoryBytes, nowMs, readMemoryBytes } from "./runnerMetrics.js";
import { compareValues, createConsole, formatError, stringifyValue } from "./runnerValue.js";
import { compileUserCode, executeDesignCase } from "./runnerJavaScript.js";
import {
  getPythonCallPlan,
  getPythonTypeHints,
  getStructuredKind,
  serializeInputJS,
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

function readDesignCase(parsedInput, functionName) {
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
    operations.length > 0 &&
    operations.every((operation) => typeof operation === "string") &&
    operations[0] === functionName &&
    Array.isArray(args) &&
    args.length === operations.length &&
    args.every((item) => Array.isArray(item))
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

function namedValuesToMap(serializedInput) {
  return new Map(serializedInput.names.map((name, index) => [name, serializedInput.values[index]]));
}

function buildNamedOutput(expected, returnValue, serializedInput) {
  const valuesByName = namedValuesToMap(serializedInput);

  return {
    kind: "named",
    hasReturn: expected.hasReturn,
    returnValue,
    fields: expected.fields.map((field) => ({
      name: field.name,
      value: valuesByName.get(field.name),
    })),
  };
}

function compareNamedOutput(output, expected, judgeMode) {
  if (expected.hasReturn && !compareValues(output.returnValue, expected.returnValue, judgeMode)) {
    return false;
  }

  return expected.fields.every((expectedField, index) =>
    compareValues(output.fields[index]?.value, expectedField.value, judgeMode),
  );
}

function compareRemoveElementOutput(output, expected) {
  if (!expected.hasReturn || !compareValues(output.returnValue, expected.returnValue, "exact")) {
    return false;
  }

  const expectedLength = expected.returnValue;
  const outputField = output.fields.find((field) => field.name === "nums");
  const expectedField = expected.fields.find((field) => field.name === "nums");

  if (
    !Number.isInteger(expectedLength) ||
    expectedLength < 0 ||
    !Array.isArray(outputField?.value) ||
    !Array.isArray(expectedField?.value) ||
    outputField.value.length < expectedLength ||
    expectedField.value.length < expectedLength
  ) {
    return false;
  }

  return compareValues(
    outputField.value.slice(0, expectedLength),
    expectedField.value.slice(0, expectedLength),
    "unordered-array",
  );
}

function compareRandomDesignOutput(output, expected, designCase) {
  if (
    !designCase ||
    designCase.operations[0] !== "Solution" ||
    !designCase.operations.includes("getRandom")
  ) {
    return null;
  }

  const values = designCase.args[0]?.[0];

  if (!Array.isArray(values) || !Array.isArray(output) || expected.kind !== "value") {
    return null;
  }

  const expectedValues = expected.value;

  if (!Array.isArray(expectedValues) || output.length !== expectedValues.length) {
    return false;
  }

  return output.every((item, index) => {
    if (designCase.operations[index] !== "getRandom") {
      return compareValues(item, expectedValues[index], "exact");
    }

    return values.some((value) => compareValues(item, value, "exact"));
  });
}

function compareRunOutput(output, expected, judgeMode, functionName, designCase) {
  const randomDesignResult = compareRandomDesignOutput(output, expected, designCase);

  if (typeof randomDesignResult === "boolean") {
    return randomDesignResult;
  }

  if (expected.kind === "named") {
    if (functionName === "removeElement") {
      return compareRemoveElementOutput(output, expected);
    }

    return compareNamedOutput(output, expected, judgeMode);
  }

  return compareValues(output, expected.value, judgeMode);
}

function formatRunOutput(output, expected) {
  if (expected.kind === "named") {
    return formatNamedOutput(output);
  }

  return stringifyValue(output);
}

function buildJavaScriptCaseOutput({ expected, output, parsedInput, transformedInput, code, designCase }) {
  if (expected.kind === "named" && !designCase) {
    const returnValue = transformOutputJS(output, code);
    const serializedInput = serializeInputJS(transformedInput, code, parsedInput.names);
    return buildNamedOutput(expected, returnValue, serializedInput);
  }

  return designCase ? output : transformOutputJS(output, code, transformedInput[0], parsedInput.names);
}

function serializePythonArg(compiled, arg, kind) {
  const serializedArg = kind ? compiled.serializeValue(arg, kind) : arg;

  try {
    return pythonValueToJs(serializedArg);
  } finally {
    if (serializedArg !== arg) {
      destroyPyProxy(serializedArg);
    }
  }
}

function serializePythonInput(compiled, args, callPlan) {
  return {
    names: callPlan.map((item) => item.name),
    values: callPlan.map((item, index) => serializePythonArg(compiled, args[index], item.kind)),
  };
}

async function runJavaScriptUserCode(request) {
  const logs = [];
  const totalStartedAt = nowMs();
  let activeLogs = logs;
  const consoleApi = createConsole(() => activeLogs);
  const cases = [];

  let compiled;

  try {
    compiled = compileUserCode(request.code, request.functionName, consoleApi);
  } catch (error) {
    return createCompileErrorResult(error, totalStartedAt, request.testCases.length, cases, logs);
  }

  for (let index = 0; index < request.testCases.length; index += 1) {
    const testCase = request.testCases[index];
    const caseLogs = [];
    let durationMs = 0;
    let solutionStartedAt;

    try {
      activeLogs = caseLogs;
      const parsedInput = parseInputAssignments(testCase.input);
      const expected = parseExpectedOutput(testCase.expected);
      const designCase = readDesignCase(parsedInput, request.functionName);
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
      const normalizedOutput = buildJavaScriptCaseOutput({
        expected,
        output,
        parsedInput,
        transformedInput,
        code: request.code,
        designCase,
      });
      const memoryBytes = await measureMemoryBytes(
        memoryStartedBytes,
        normalizedOutput,
        [parsedInput.values, transformedInput, output],
        compiled.memoryTracker.readBytes(),
      );
      const passed = compareRunOutput(
        normalizedOutput,
        expected,
        request.judgeMode,
        request.functionName,
        designCase,
      );
      cases.push({
        id: testCase.id,
        name: `Case ${index + 1}`,
        passed,
        durationMs,
        memoryBytes,
        logs: caseLogs,
        inputText: testCase.input,
        outputText: formatRunOutput(normalizedOutput, expected),
        expectedText: formatExpectedOutput(expected),
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
        logs: caseLogs,
        inputText: testCase.input,
        outputText: "",
        expectedText: cleanValueText(testCase.expected),
        errorText: formatError(error),
      });
    } finally {
      logs.push(...caseLogs);
      activeLogs = logs;
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
      const caseLogs = [];
      let durationMs = 0;
      let solutionStartedAt;
      let outputProxy;
      let serializedOutputProxy;
      const args = [];
      const rawArgProxies = [];

      try {
        setPythonLogsTarget(caseLogs);
        const parsedInput = parseInputAssignments(testCase.input);
        const expected = parseExpectedOutput(testCase.expected);
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
        const normalizedOutput =
          expected.kind === "named"
            ? buildNamedOutput(expected, output, serializePythonInput(compiled, args, callPlan))
            : output;
        const memoryBytes = await measureMemoryBytes(memoryStartedBytes, normalizedOutput, [
          parsedInput.values,
          normalizedOutput,
        ]);
        const passed = compareRunOutput(
          normalizedOutput,
          expected,
          request.judgeMode,
          request.functionName,
        );

        cases.push({
          id: testCase.id,
          name: `Case ${index + 1}`,
          passed,
          durationMs,
          memoryBytes,
          logs: caseLogs,
          inputText: testCase.input,
          outputText: formatRunOutput(normalizedOutput, expected),
          expectedText: formatExpectedOutput(expected),
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
          logs: caseLogs,
          inputText: testCase.input,
          outputText: "",
          expectedText: cleanValueText(testCase.expected),
          errorText: formatError(error),
        });
      } finally {
        logs.push(...caseLogs);
        setPythonLogsTarget(logs);

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
