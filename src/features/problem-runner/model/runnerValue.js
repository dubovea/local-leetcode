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

export function stringifyValue(value) {
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

export function compareValues(output, expected, judgeMode) {
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

export function formatError(error) {
  if (error instanceof Error) {
    return error.stack || error.message;
  }

  return String(error);
}

export function createConsole(logs) {
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
