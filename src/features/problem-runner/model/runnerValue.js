export const WILDCARD_VALUE = Object.freeze({ __runnerWildcard: true });

export function isWildcardValue(value) {
  return value === WILDCARD_VALUE || Boolean(value?.__runnerWildcard);
}

function stableObject(value) {
  if (isWildcardValue(value)) {
    return value;
  }

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

export function stringifyValue(value) {
  if (isWildcardValue(value)) {
    return "_";
  }

  if (typeof value === "undefined") {
    return "undefined";
  }

  if (typeof value === "function") {
    return "[Function]";
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return String(value);
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stringifyValue(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    try {
      const normalized = stableObject(value);
      const entries = Object.keys(normalized).map(
        (key) => `${JSON.stringify(key)}:${stringifyValue(normalized[key])}`,
      );

      return `{${entries.join(",")}}`;
    } catch {
      return String(value);
    }
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

function hasWildcard(value) {
  if (isWildcardValue(value)) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some(hasWildcard);
  }

  if (value && typeof value === "object") {
    return Object.values(value).some(hasWildcard);
  }

  return false;
}

function areValuesEqual(output, expected) {
  if (isWildcardValue(expected)) {
    return true;
  }

  if (Object.is(output, expected)) {
    return true;
  }

  if (Array.isArray(output) || Array.isArray(expected)) {
    if (!Array.isArray(output) || !Array.isArray(expected)) {
      return false;
    }

    if (output.length !== expected.length) {
      return false;
    }

    return expected.every((expectedItem, index) => areValuesEqual(output[index], expectedItem));
  }

  if (output && expected && typeof output === "object" && typeof expected === "object") {
    const outputKeys = Object.keys(output).sort();
    const expectedKeys = Object.keys(expected).sort();

    if (outputKeys.length !== expectedKeys.length) {
      return false;
    }

    return expectedKeys.every(
      (key, index) => key === outputKeys[index] && areValuesEqual(output[key], expected[key]),
    );
  }

  return false;
}

export function compareValues(output, expected, judgeMode) {
  if (judgeMode === "unordered-array" && !hasWildcard(output) && !hasWildcard(expected)) {
    return (
      stringifyValue(normalizeUnorderedArray(output)) ===
      stringifyValue(normalizeUnorderedArray(expected))
    );
  }

  return areValuesEqual(stableObject(output), stableObject(expected));
}

function formatValue(value) {
  if (typeof value === "string") {
    return value;
  }

  return stringifyValue(value);
}

export function formatError(error) {
  if (error instanceof Error) {
    return error.stack || error.message;
  }

  return String(error);
}

export function createConsole(logs) {
  return ["log", "warn", "error", "table"].reduce((consoleApi, type) => {
    consoleApi[type] = (...args) => {
      const targetLogs = typeof logs === "function" ? logs() : logs;

      targetLogs.push({
        type,
        text: args.map(formatValue).join(" "),
      });
    };

    return consoleApi;
  }, {});
}
