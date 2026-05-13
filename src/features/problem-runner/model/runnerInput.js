const ASSIGNMENT_START_RE = /^[A-Za-z_$][\w$]*\s*=/;

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

export function evaluateLiteral(valueText) {
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
