const ASSIGNMENT_START_RE = /^[A-Za-z_$][\w$]*\s*=/;

function nowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
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
  const cleanText = cleanValueText(valueText).replace(/,\s*$/, "");

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
    return stringifyValue(normalizeUnorderedArray(output)) === stringifyValue(normalizeUnorderedArray(expected));
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

function compileUserCode(code, functionName, consoleApi) {
  const factory = Function(
    "console",
    `"use strict";\n${code}\n; return typeof ${functionName} !== "undefined" ? ${functionName} : undefined;`,
  );

  const solution = factory(consoleApi);

  if (typeof solution !== "function") {
    throw new Error(`Function "${functionName}" was not found`);
  }

  return solution;
}

export async function runUserCode(request) {
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
    const caseStartedAt = nowMs();

    try {
      const parsedInput = parseInputAssignments(testCase.input);
      const expected = evaluateLiteral(testCase.expected);
      const output = await solution(...parsedInput.values);
      const passed = compareValues(output, expected, request.judgeMode);

      cases.push({
        id: testCase.id,
        name: `Case ${index + 1}`,
        passed,
        durationMs: nowMs() - caseStartedAt,
        inputText: testCase.input,
        outputText: stringifyValue(output),
        expectedText: stringifyValue(expected),
      });
    } catch (error) {
      cases.push({
        id: testCase.id,
        name: `Case ${index + 1}`,
        passed: false,
        durationMs: nowMs() - caseStartedAt,
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
    durationMs: nowMs() - totalStartedAt,
    passedCount,
    totalCount: request.testCases.length,
    cases,
    logs,
  };
}
