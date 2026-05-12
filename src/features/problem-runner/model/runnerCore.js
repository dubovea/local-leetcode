import {
  CustomFunction,
  Employee,
  Iterator,
  ListNode,
  Master,
  MountainArray,
  Node,
  NestedInteger,
  TreeNode,
  _Node,
  arrayToBinaryTree,
  arrayToEmployees,
  arrayToGraph,
  arrayToIterator,
  arrayToLinkedList,
  arrayToMountainArray,
  arrayToNaryTree,
  arrayToNestedInteger,
  arrayToQuadTree,
  arrayToRandomList,
  binaryTreeToArray,
  binaryTreeNextToArray,
  graphToArray,
  linkedListToArray,
  naryTreeToArray,
  nestedIntegerToValue,
  quadTreeToArray,
  randomListToArray,
  valueToCustomFunction,
  valuesToMaster,
} from "./structures.js";
const ASSIGNMENT_START_RE = /^[A-Za-z_$][\w$]*\s*=/;
const DEFAULT_LANGUAGE = "javascript";
const PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v0.29.4/full/";
const PYODIDE_MODULE_URL = `${PYODIDE_INDEX_URL}pyodide.mjs`;
const PYTHON_PRELUDE = `
from __future__ import annotations
from typing import *

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
`;

let pyodidePromise;
let pythonLogsTarget = null;

function nowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}

async function readMemoryBytes() {
  const measureUserAgentSpecificMemory =
    typeof performance !== "undefined" &&
    performance &&
    typeof performance.measureUserAgentSpecificMemory === "function"
      ? performance.measureUserAgentSpecificMemory.bind(performance)
      : undefined;

  if (measureUserAgentSpecificMemory) {
    try {
      const sample = await measureUserAgentSpecificMemory();

      if (Number.isFinite(sample?.bytes)) {
        return sample.bytes;
      }
    } catch {
      // Fall back to lighter browser-specific heap counters below.
    }
  }

  const memory =
    typeof performance !== "undefined" && performance && "memory" in performance
      ? performance.memory
      : undefined;
  const usedHeapSize = memory?.usedJSHeapSize;

  return Number.isFinite(usedHeapSize) ? usedHeapSize : undefined;
}

function estimateValueMemoryBytes(value, seen = new Set()) {
  if (value === null || typeof value === "undefined") {
    return 0;
  }

  if (typeof value === "string") {
    return value.length * 2;
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return 8;
  }

  if (typeof value === "boolean") {
    return 4;
  }

  if (typeof value !== "object") {
    return 0;
  }

  if (seen.has(value)) {
    return 0;
  }

  seen.add(value);

  if (value instanceof ArrayBuffer) {
    return value.byteLength;
  }

  if (ArrayBuffer.isView(value)) {
    return value.byteLength;
  }

  if (Array.isArray(value)) {
    return value.reduce(
      (total, item) => total + estimateValueMemoryBytes(item, seen),
      24 + value.length * 8,
    );
  }

  return Object.entries(value).reduce(
    (total, [key, item]) => total + key.length * 2 + estimateValueMemoryBytes(item, seen),
    32,
  );
}

async function measureMemoryBytes(startHeapBytes, output) {
  const finishHeapBytes = await readMemoryBytes();
  const heapDelta =
    typeof startHeapBytes === "number" && typeof finishHeapBytes === "number"
      ? Math.max(0, finishHeapBytes - startHeapBytes)
      : 0;

  return Math.max(heapDelta, estimateValueMemoryBytes(output));
}

function maxCaseMemoryBytes(cases) {
  const values = cases
    .map((testCase) => testCase.memoryBytes)
    .filter((memoryBytes) => Number.isFinite(memoryBytes));

  return values.length > 0 ? Math.max(...values) : undefined;
}

function cleanInputText(text) {
  return String(text ?? "")
    .trim()
    .replace(/^Input\s*:?\s*/i, "")
    .trim();
}

function cleanValueText(text) {
  return String(text ?? "")
    .trim()
    .replace(/^(Output|Expected)\s*:?\s*/i, "")
    .trim();
}

function readIdentifier(source, index) {
  const match = /^[A-Za-z_$][\w$]*/.exec(source.slice(index));

  if (!match) {
    throw new Error(`Expected parameter name near: ${source.slice(index, index + 30)}`);
  }

  return {
    name: match[0],
    nextIndex: index + match[0].length,
  };
}

function skipSpaces(source, index) {
  let nextIndex = index;

  while (nextIndex < source.length && /[\s,;]/.test(source[nextIndex])) {
    nextIndex += 1;
  }

  return nextIndex;
}

function isNextAssignment(source, index) {
  let nextIndex = index;

  while (nextIndex < source.length && /[ \t\r\n]/.test(source[nextIndex])) {
    nextIndex += 1;
  }

  return ASSIGNMENT_START_RE.test(source.slice(nextIndex));
}

function findValueEnd(source, index) {
  let nextIndex = index;
  let depth = 0;
  let quote = "";
  let escaping = false;

  while (nextIndex < source.length) {
    const char = source[nextIndex];

    if (quote) {
      if (escaping) {
        escaping = false;
      } else if (char === "\\") {
        escaping = true;
      } else if (char === quote) {
        quote = "";
      }

      nextIndex += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      nextIndex += 1;
      continue;
    }

    if (char === "[" || char === "{" || char === "(") {
      depth += 1;
      nextIndex += 1;
      continue;
    }

    if (char === "]" || char === "}" || char === ")") {
      depth -= 1;
      nextIndex += 1;
      continue;
    }

    if (depth === 0 && char === "\n" && isNextAssignment(source, nextIndex + 1)) {
      break;
    }

    if (depth === 0 && char === "," && isNextAssignment(source, nextIndex + 1)) {
      break;
    }

    if (depth === 0 && char === ";") {
      break;
    }

    nextIndex += 1;
  }

  return nextIndex;
}

function evaluateLiteral(valueText) {
  const cleanText = cleanValueText(valueText)
    .replace(/,\s*$/, "")
    .replace(/(^|[\[,]\s*)#(?=\s*[,\]])/g, '$1"#"');

  if (!cleanText) {
    throw new Error("Expected a value, but got an empty string");
  }

  return Function(`"use strict"; return (${cleanText});`)();
}

export function parseInputAssignments(inputText) {
  const source = cleanInputText(inputText);
  const names = [];
  const values = [];

  let index = skipSpaces(source, 0);

  while (index < source.length) {
    const identifier = readIdentifier(source, index);
    const name = identifier.name;

    index = skipSpaces(source, identifier.nextIndex);

    if (source[index] !== "=") {
      throw new Error(`Expected "=" after parameter "${name}"`);
    }

    index = skipSpaces(source, index + 1);

    const valueEnd = findValueEnd(source, index);
    const valueText = source.slice(index, valueEnd).trim();

    names.push(name);
    values.push(evaluateLiteral(valueText));

    index = skipSpaces(source, valueEnd + (source[valueEnd] === ";" ? 1 : 0));
  }

  return { names, values };
}

function normalizeTypeName(type) {
  return String(type ?? "")
    .replace(/\s+/g, "")
    .replace(/^Array\.</, "")
    .replace(/\bnull\b/g, "")
    .replace(/>$/, "");
}

function hasType(type, target) {
  return normalizeTypeName(type)
    .split(/[|&]/)
    .some((candidate) => candidate === target || candidate.includes(target));
}

function getStructuredKind(type, code) {
  const normalizedType = normalizeTypeName(type);

  if (hasType(normalizedType, "ListNode")) {
    return "linked-list";
  }

  if (hasType(normalizedType, "TreeNode")) {
    return "binary-tree";
  }

  if (hasType(normalizedType, "Employee")) {
    return "employees";
  }

  if (hasType(normalizedType, "NestedInteger")) {
    return "nested-integer";
  }

  if (hasType(normalizedType, "Iterator")) {
    return "iterator";
  }

  if (hasType(normalizedType, "MountainArray")) {
    return "mountain-array";
  }

  if (hasType(normalizedType, "CustomFunction")) {
    return "custom-function";
  }

  if (hasType(normalizedType, "Master")) {
    return "master";
  }

  if (hasType(normalizedType, "_Node") || hasType(normalizedType, "Node")) {
    if (code.includes("neighbors")) {
      return "graph";
    }

    if (code.includes("random")) {
      return "random-list";
    }

    if (code.includes("isLeaf") || code.includes("topLeft")) {
      return "quad-tree";
    }

    if (code.includes("children")) {
      return "nary-tree";
    }

    if (code.includes("next") && code.includes("left") && code.includes("right")) {
      return "binary-tree-next";
    }
  }

  return null;
}

function getJsTypeHints(code) {
  const params = [];
  const paramPattern = /@param\s+\{([^}]+)\}\s+([A-Za-z_$][\w$]*)/g;
  let paramMatch;

  while ((paramMatch = paramPattern.exec(code))) {
    params.push({
      type: normalizeTypeName(paramMatch[1]),
      name: paramMatch[2],
    });
  }

  const returnType = normalizeTypeName(/@return\s+\{([^}]+)\}/.exec(code)?.[1]);

  return { params, returnType };
}

function transformStructuredValue(value, type, code) {
  const normalizedType = normalizeTypeName(type);
  const structuredKind = getStructuredKind(normalizedType, code);

  if (structuredKind === "employees") {
    return arrayToEmployees(value);
  }

  if (normalizedType.endsWith("[]")) {
    const itemType = normalizedType.slice(0, -2);
    return Array.isArray(value)
      ? value.map((item) => transformStructuredValue(item, itemType, code))
      : value;
  }

  switch (structuredKind) {
    case "linked-list":
      return arrayToLinkedList(value);
    case "binary-tree":
      return arrayToBinaryTree(value);
    case "binary-tree-next":
      return arrayToBinaryTree(value, _Node);
    case "nary-tree":
      return arrayToNaryTree(value);
    case "graph":
      return arrayToGraph(value);
    case "random-list":
      return arrayToRandomList(value);
    case "quad-tree":
      return arrayToQuadTree(value);
    case "employees":
      return arrayToEmployees(value);
    case "nested-integer":
      return Array.isArray(value) ? value.map(arrayToNestedInteger) : arrayToNestedInteger(value);
    case "iterator":
      return arrayToIterator(value);
    case "mountain-array":
      return arrayToMountainArray(value);
    case "custom-function":
      return valueToCustomFunction(value);
    case "master":
      return value;
    default:
      break;
  }

  return value;
}

function serializeStructuredValue(value, type, code) {
  const normalizedType = normalizeTypeName(type);

  if (normalizedType.endsWith("[]")) {
    const itemType = normalizedType.slice(0, -2);
    return Array.isArray(value)
      ? value.map((item) => serializeStructuredValue(item, itemType, code))
      : value;
  }

  switch (getStructuredKind(normalizedType, code)) {
    case "linked-list":
      return linkedListToArray(value);
    case "binary-tree":
      return binaryTreeToArray(value);
    case "binary-tree-next":
      return binaryTreeNextToArray(value);
    case "nary-tree":
      return naryTreeToArray(value);
    case "graph":
      return graphToArray(value);
    case "random-list":
      return randomListToArray(value);
    case "quad-tree":
      return quadTreeToArray(value);
    case "nested-integer":
      return nestedIntegerToValue(value);
    default:
      break;
  }

  return value;
}

export function transformInputJS(values, code, names = []) {
  const typeHints = getJsTypeHints(code);
  const namedValues = new Map(names.map((name, index) => [name, values[index]]));

  if (typeHints.params.length > 0 && names.length > 0) {
    return typeHints.params.map((hint, index) => {
      if (getStructuredKind(hint.type, code) === "custom-function") {
        return valueToCustomFunction(namedValues.get(hint.name) ?? namedValues.get("function_id"));
      }

      if (getStructuredKind(hint.type, code) === "master") {
        return valuesToMaster(namedValues.get("secret"), namedValues.get("allowedGuesses"));
      }

      const value = namedValues.has(hint.name) ? namedValues.get(hint.name) : values[index];

      return transformStructuredValue(value, hint.type, code);
    });
  }

  return values.map((value, index) => {
    const hint =
      typeHints.params.find((param) => param.name === names[index]) ?? typeHints.params[index];

    return hint ? transformStructuredValue(value, hint.type, code) : value;
  });
}

export function transformOutputJS(value, code, fallbackValue) {
  const { returnType } = getJsTypeHints(code);

  if (returnType === "void") {
    return serializeStructuredValue(fallbackValue, getJsTypeHints(code).params[0]?.type, code);
  }

  return serializeStructuredValue(value, returnType, code);
}

function stableObject(value) {
  if (Array.isArray(value)) {
    return value.map(stableObject);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = stableObject(value[key]);
        return acc;
      }, {});
  }

  return value;
}

function stringifyValue(value) {
  if (typeof value === "undefined") {
    return "undefined";
  }

  if (typeof value === "function") {
    return "[Function]";
  }

  try {
    const json = JSON.stringify(value);
    return typeof json === "undefined" ? String(value) : json;
  } catch {
    return String(value);
  }
}

function normalizeUnorderedArray(value) {
  if (Array.isArray(value)) {
    return value
      .map(normalizeUnorderedArray)
      .sort((left, right) => stringifyValue(left).localeCompare(stringifyValue(right)));
  }

  if (value && typeof value === "object") {
    return stableObject(value);
  }

  return value;
}

function compareValues(output, expected, judgeMode) {
  if (judgeMode === "unordered-array") {
    return (
      stringifyValue(normalizeUnorderedArray(output)) ===
      stringifyValue(normalizeUnorderedArray(expected))
    );
  }

  return stringifyValue(stableObject(output)) === stringifyValue(stableObject(expected));
}

function formatValue(value) {
  if (typeof value === "string") {
    return value;
  }

  return stringifyValue(value);
}

function formatError(error) {
  if (error instanceof Error) {
    return error.stack || error.message;
  }

  return String(error);
}

function createConsole(logs) {
  return ["log", "warn", "error", "table"].reduce((consoleApi, type) => {
    consoleApi[type] = (...args) => {
      logs.push({
        type,
        text: args.map(formatValue).join(" "),
      });
    };

    return consoleApi;
  }, {});
}

async function getPyodideRuntime() {
  if (!pyodidePromise) {
    pyodidePromise = import(/* @vite-ignore */ PYODIDE_MODULE_URL)
      .then(({ loadPyodide }) =>
        loadPyodide({
          indexURL: PYODIDE_INDEX_URL,
          stdout: (text) => {
            pythonLogsTarget?.push({ type: "log", text });
          },
          stderr: (text) => {
            pythonLogsTarget?.push({ type: "error", text });
          },
        }),
      )
      .catch((error) => {
        pyodidePromise = null;
        throw new Error(`Failed to load Python (Pyodide) runtime: ${formatError(error)}`);
      });
  }

  return pyodidePromise;
}

function compileUserCode(code, functionName, consoleApi) {
  const factory = Function(
    "console",
    "ListNode",
    "TreeNode",
    "Node",
    "_Node",
    "Employee",
    "NestedInteger",
    "Iterator",
    "MountainArray",
    "CustomFunction",
    "Master",
    `"use strict";\n${code}\n; return typeof ${functionName} !== "undefined" ? ${functionName} : undefined;`,
  );

  const solution = factory(
    consoleApi,
    ListNode,
    TreeNode,
    Node,
    _Node,
    Employee,
    NestedInteger,
    Iterator,
    MountainArray,
    CustomFunction,
    Master,
  );

  if (typeof solution !== "function") {
    throw new Error(`Function "${functionName}" was not found`);
  }

  return solution;
}

function destroyPyProxy(value) {
  if (value && typeof value.destroy === "function") {
    value.destroy();
  }
}

function pythonValueToJs(value) {
  if (value && typeof value.toJs === "function") {
    return value.toJs({ dict_converter: Object.fromEntries });
  }

  return value;
}

async function compilePythonCode(code, functionName) {
  const pyodide = await getPyodideRuntime();
  const globals = pyodide.toPy({});

  try {
    pyodide.runPython(`${PYTHON_PRELUDE}\n${code}`, { globals });

    const solution = pyodide.runPython(
      `
__medik_solution = globals().get("${functionName}")
if __medik_solution is None and "Solution" in globals():
    __medik_instance = Solution()
    __medik_solution = getattr(__medik_instance, "${functionName}", None)
__medik_solution
`,
      { globals },
    );

    if (typeof solution !== "function") {
      destroyPyProxy(solution);
      throw new Error(`Function "${functionName}" was not found`);
    }

    return { pyodide, globals, solution };
  } catch (error) {
    destroyPyProxy(globals);
    throw error;
  }
}

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

function executeDesignCase(Constructor, designCase, code) {
  const [constructorArgs = [], ...methodArgs] = designCase.args;
  const instance = new Constructor(...transformInputJS(constructorArgs, code));
  const output = [null];

  for (let index = 1; index < designCase.operations.length; index += 1) {
    const methodName = designCase.operations[index];
    const method = instance[methodName];

    if (typeof method !== "function") {
      throw new Error(`Method "${methodName}" was not found`);
    }

    const result = method.apply(instance, methodArgs[index - 1] ?? []);
    output.push(typeof result === "undefined" ? null : result);
  }

  return output;
}

async function runJavaScriptUserCode(request) {
  const logs = [];
  const totalStartedAt = nowMs();
  const consoleApi = createConsole(logs);
  const cases = [];

  let solution;

  try {
    solution = compileUserCode(request.code, request.functionName, consoleApi);
  } catch (error) {
    return {
      ok: false,
      status: "runtime-error",
      durationMs: nowMs() - totalStartedAt,
      passedCount: 0,
      totalCount: request.testCases.length,
      cases,
      logs,
      errorText: formatError(error),
    };
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
      solutionStartedAt = nowMs();
      const output = designCase
        ? executeDesignCase(solution, designCase, request.code)
        : await solution(...transformedInput);
      durationMs = nowMs() - solutionStartedAt;
      const normalizedOutput = designCase
        ? output
        : transformOutputJS(output, request.code, transformedInput[0]);
      const memoryBytes = await measureMemoryBytes(memoryStartedBytes, normalizedOutput);
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

  const passedCount = cases.filter((testCase) => testCase.passed).length;
  const hasRuntimeError = cases.some((testCase) => testCase.errorText);
  const ok = passedCount === request.testCases.length;

  return {
    ok,
    status: ok ? "accepted" : hasRuntimeError ? "runtime-error" : "wrong-answer",
    durationMs: cases.reduce((total, testCase) => total + testCase.durationMs, 0),
    memoryBytes: ok ? maxCaseMemoryBytes(cases) : undefined,
    passedCount,
    totalCount: request.testCases.length,
    cases,
    logs,
  };
}

async function runPythonUserCode(request) {
  const logs = [];
  const totalStartedAt = nowMs();
  const cases = [];

  let compiled;

  pythonLogsTarget = logs;

  try {
    compiled = await compilePythonCode(request.code, request.functionName);
  } catch (error) {
    pythonLogsTarget = null;

    return {
      ok: false,
      status: "runtime-error",
      durationMs: nowMs() - totalStartedAt,
      passedCount: 0,
      totalCount: request.testCases.length,
      cases,
      logs,
      errorText: formatError(error),
    };
  }

  try {
    for (let index = 0; index < request.testCases.length; index += 1) {
      const testCase = request.testCases[index];
      let durationMs = 0;
      let solutionStartedAt;
      let outputProxy;
      const args = [];

      try {
        const parsedInput = parseInputAssignments(testCase.input);
        const expected = evaluateLiteral(testCase.expected);

        for (const value of parsedInput.values) {
          args.push(compiled.pyodide.toPy(value));
        }

        const memoryStartedBytes = await readMemoryBytes();
        solutionStartedAt = nowMs();
        outputProxy = compiled.solution(...args);
        durationMs = nowMs() - solutionStartedAt;

        const output = pythonValueToJs(outputProxy);
        const memoryBytes = await measureMemoryBytes(memoryStartedBytes, output);
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
        destroyPyProxy(outputProxy);

        for (const arg of args) {
          destroyPyProxy(arg);
        }
      }
    }
  } finally {
    pythonLogsTarget = null;
    destroyPyProxy(compiled.solution);
    destroyPyProxy(compiled.globals);
  }

  const passedCount = cases.filter((testCase) => testCase.passed).length;
  const hasRuntimeError = cases.some((testCase) => testCase.errorText);
  const ok = passedCount === request.testCases.length;

  return {
    ok,
    status: ok ? "accepted" : hasRuntimeError ? "runtime-error" : "wrong-answer",
    durationMs: cases.reduce((total, testCase) => total + testCase.durationMs, 0),
    memoryBytes: ok ? maxCaseMemoryBytes(cases) : undefined,
    passedCount,
    totalCount: request.testCases.length,
    cases,
    logs,
  };
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
