import {
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

export function getStructuredKind(type, code) {
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

function splitTopLevelCommaList(text) {
  const parts = [];
  let start = 0;
  let depth = 0;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === "[" || char === "(" || char === "<") {
      depth += 1;
    } else if (char === "]" || char === ")" || char === ">") {
      depth -= 1;
    } else if (char === "," && depth === 0) {
      parts.push(text.slice(start, index).trim());
      start = index + 1;
    }
  }

  const tail = text.slice(start).trim();

  if (tail) {
    parts.push(tail);
  }

  return parts;
}

export function getPythonTypeHints(code, functionName) {
  const escapedFunctionName = functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `def\\s+${escapedFunctionName}\\s*\\(([^)]*)\\)\\s*(?:->\\s*([^:\\n]+))?:`,
  );
  const match = pattern.exec(code);

  if (!match) {
    return { params: [], returnType: "" };
  }

  const params = splitTopLevelCommaList(match[1])
    .map((param) => param.replace(/=.*/, "").trim())
    .filter((param) => param && param !== "self" && param !== "cls")
    .map((param) => {
      const [name, type = ""] = param.split(/:\s*/);

      return {
        name: name.trim(),
        type: normalizeTypeName(type),
      };
    });

  return {
    params,
    returnType: normalizeTypeName(match[2] ?? ""),
  };
}

export function getPythonCallPlan(code, functionName, parsedInput) {
  const typeHints = getPythonTypeHints(code, functionName);
  const namedValues = new Map(
    parsedInput.names.map((name, index) => [name, parsedInput.values[index]]),
  );

  if (typeHints.params.length === 0) {
    return parsedInput.values.map((value, index) => ({
      value,
      kind: getStructuredKind("", code),
      name: parsedInput.names[index],
    }));
  }

  return typeHints.params.map((hint, index) => {
    if (getStructuredKind(hint.type, code) === "custom-function") {
      return {
        value: namedValues.get(hint.name) ?? namedValues.get("function_id"),
        kind: "custom-function",
        name: hint.name,
      };
    }

    if (getStructuredKind(hint.type, code) === "master") {
      return {
        value: {
          secret: namedValues.get("secret"),
          allowedGuesses: namedValues.get("allowedGuesses"),
        },
        kind: "master",
        name: hint.name,
      };
    }

    return {
      value: namedValues.has(hint.name) ? namedValues.get(hint.name) : parsedInput.values[index],
      kind: getStructuredKind(hint.type, code),
      name: hint.name,
    };
  });
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
