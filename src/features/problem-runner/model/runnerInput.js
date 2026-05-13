import { stringifyValue, WILDCARD_VALUE } from "./runnerValue.js";

const ASSIGNMENT_START_RE = /^[A-Za-z_$][\w$]*\s*=/;
const IDENTIFIER_RE = /^[A-Za-z_$][\w$]*/;

function cleanInputText(text) {
  return String(text ?? "")
    .trim()
    .replace(/^Input\s*:?\s*/i, "")
    .trim();
}

export function cleanValueText(text) {
  return String(text ?? "")
    .trim()
    .replace(/^(Output|Expected)\s*:?\s*/i, "")
    .trim();
}

function readIdentifier(source, index) {
  const match = IDENTIFIER_RE.exec(source.slice(index));

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

function splitTopLevelCommaList(source) {
  const parts = [];
  let start = 0;
  let depth = 0;
  let quote = "";
  let escaping = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaping) {
        escaping = false;
      } else if (char === "\\") {
        escaping = true;
      } else if (char === quote) {
        quote = "";
      }

      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "[" || char === "{" || char === "(") {
      depth += 1;
      continue;
    }

    if (char === "]" || char === "}" || char === ")") {
      depth -= 1;
      continue;
    }

    if (char === "," && depth === 0) {
      const part = source.slice(start, index).trim();

      if (part) {
        parts.push(part);
      }

      start = index + 1;
    }
  }

  const tail = source.slice(start).trim();

  if (tail) {
    parts.push(tail);
  }

  return parts;
}

function readAssignmentPart(part) {
  const identifierMatch = IDENTIFIER_RE.exec(part);

  if (!identifierMatch) {
    return null;
  }

  const identifier = { name: identifierMatch[0], nextIndex: identifierMatch[0].length };
  const afterNameIndex = identifier.nextIndex;
  let index = afterNameIndex;

  while (index < part.length && /\s/.test(part[index])) {
    index += 1;
  }

  if (part[index] !== "=") {
    return null;
  }

  return {
    name: identifier.name,
    value: evaluateLiteral(part.slice(index + 1).trim()),
  };
}

export function evaluateLiteral(valueText) {
  const cleanText = cleanValueText(valueText)
    .replace(/,\s*$/, "")
    .replace(/(^|[\[,]\s*)#(?=\s*[,\]])/g, '$1"#"');

  if (!cleanText) {
    throw new Error("Expected a value, but got an empty string");
  }

  return Function("_", "nums", `"use strict"; return (${cleanText});`)(WILDCARD_VALUE);
}

export function parseExpectedOutput(expectedText) {
  const source = cleanValueText(expectedText).replace(/;\s*$/, "");

  if (!source) {
    throw new Error("Expected a value, but got an empty string");
  }

  const parts = splitTopLevelCommaList(source);
  const hasNamedPart = parts.some((part) => ASSIGNMENT_START_RE.test(part));

  if (!hasNamedPart) {
    return {
      kind: "value",
      value: evaluateLiteral(source),
    };
  }

  const fields = [];
  let hasReturn = false;
  let returnValue;

  for (const part of parts) {
    const assignment = readAssignmentPart(part);

    if (assignment) {
      if (assignment.name === "return") {
        hasReturn = true;
        returnValue = assignment.value;
      } else {
        fields.push(assignment);
      }

      continue;
    }

    if (hasReturn) {
      throw new Error(`Unexpected output part: ${part}`);
    }

    hasReturn = true;
    returnValue = evaluateLiteral(part);
  }

  return {
    kind: "named",
    hasReturn,
    returnValue,
    fields,
  };
}

export function formatNamedOutput(output) {
  const parts = [];

  if (output.hasReturn) {
    parts.push(stringifyValue(output.returnValue));
  }

  for (const field of output.fields) {
    parts.push(`${field.name} = ${stringifyValue(field.value)}`);
  }

  return parts.join(", ");
}

export function formatExpectedOutput(expected) {
  if (expected.kind === "named") {
    return formatNamedOutput(expected);
  }

  return stringifyValue(expected.value);
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
