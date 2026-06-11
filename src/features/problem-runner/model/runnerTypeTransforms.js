import {
  _Node,
  arrayToBinaryTree,
  arrayToEmployees,
  arrayToGraph,
  arrayToIntersectingLinkedLists,
  arrayToIterator,
  arrayToLinkedListWithCycle,
  arrayToLinkedList,
  arrayToMountainArray,
  arrayToMultilevelDoublyList,
  arrayToNaryTree,
  arrayToNestedInteger,
  arrayToQuadTree,
  arrayToRandomList,
  binaryTreeToArray,
  binaryTreeNextToArray,
  findBinaryTreeNode,
  graphToArray,
  findLinkedListNode,
  linkedListNodeIndex,
  linkedListToArray,
  multilevelDoublyListToArray,
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

    if (code.includes("prev") && code.includes("child")) {
      return "multilevel-doubly-list";
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
    const structuredKind = getStructuredKind(hint.type, code);

    if (structuredKind === "custom-function") {
      return {
        value: namedValues.get(hint.name) ?? namedValues.get("function_id"),
        kind: "custom-function",
        name: hint.name,
      };
    }

    if (structuredKind === "master") {
      return {
        value: {
          secret: namedValues.get("secret"),
          allowedGuesses: namedValues.get("allowedGuesses"),
        },
        kind: "master",
        name: hint.name,
      };
    }

    if (
      structuredKind === "binary-tree" &&
      !namedValues.has(hint.name) &&
      ["original", "cloned", "root"].includes(hint.name) &&
      namedValues.has("tree")
    ) {
      return {
        value: namedValues.get("tree"),
        kind: structuredKind,
        name: hint.name,
      };
    }

    return {
      value: namedValues.has(hint.name) ? namedValues.get(hint.name) : parsedInput.values[index],
      kind: structuredKind,
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
    case "multilevel-doubly-list":
      return arrayToMultilevelDoublyList(value);
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

function createDeleteNodeInput(value, namedValues) {
  if (!namedValues.has("head") || !namedValues.has("node")) {
    return null;
  }

  const head = arrayToLinkedList(namedValues.get("head"));
  const targetNode = findLinkedListNode(head, namedValues.get("node"));

  if (!targetNode) {
    return null;
  }

  Object.defineProperty(targetNode, "__runnerHead", {
    configurable: true,
    value: head,
  });

  return targetNode;
}

function createLinkedListInput(value, hint, namedValues) {
  if (
    hint.name === "node" &&
    namedValues.has("head") &&
    !Array.isArray(value) &&
    typeof value !== "object"
  ) {
    const targetNode = createDeleteNodeInput(value, namedValues);

    if (targetNode) {
      return targetNode;
    }
  }

  if (namedValues.has("pos") && (hint.name === "head" || !namedValues.has(hint.name))) {
    return arrayToLinkedListWithCycle(value, namedValues.get("pos"));
  }

  return transformStructuredValue(value, hint.type, "");
}

function isBinaryTreeNodeReferenceValue(value) {
  return value !== null && typeof value !== "undefined" && !Array.isArray(value) && typeof value !== "object";
}

function resolveBinaryTreeValue(values, index, hint, namedValues) {
  if (namedValues.has(hint.name)) {
    return namedValues.get(hint.name);
  }

  if (["original", "cloned", "root"].includes(hint.name) && namedValues.has("tree")) {
    return namedValues.get("tree");
  }

  return values[index];
}

function getPrimaryBinaryTreeInput(binaryTreeInputs) {
  return (
    binaryTreeInputs.get("original") ??
    binaryTreeInputs.get("root") ??
    binaryTreeInputs.get("tree") ??
    [...binaryTreeInputs.values()][0] ??
    null
  );
}

function createBinaryTreeInput(value, hint, binaryTreeInputs) {
  if (isBinaryTreeNodeReferenceValue(value)) {
    return findBinaryTreeNode(getPrimaryBinaryTreeInput(binaryTreeInputs), value);
  }

  const tree = arrayToBinaryTree(value);

  if (Array.isArray(value)) {
    binaryTreeInputs.set(hint.name, tree);
  }

  return tree;
}

function createIntersectionInput(namedValues) {
  if (
    !namedValues.has("listA") ||
    !namedValues.has("listB") ||
    !namedValues.has("skipA") ||
    !namedValues.has("skipB") ||
    !namedValues.has("intersectVal")
  ) {
    return null;
  }

  return arrayToIntersectingLinkedLists(
    namedValues.get("listA"),
    namedValues.get("listB"),
    namedValues.get("skipA"),
    namedValues.get("skipB"),
    namedValues.get("intersectVal"),
  );
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
    case "multilevel-doubly-list":
      return multilevelDoublyListToArray(value);
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
  const intersectionInput = createIntersectionInput(namedValues);
  const binaryTreeInputs = new Map();

  if (typeHints.params.length > 0 && names.length > 0) {
    return typeHints.params.map((hint, index) => {
      const structuredKind = getStructuredKind(hint.type, code);

      if (getStructuredKind(hint.type, code) === "custom-function") {
        return valueToCustomFunction(namedValues.get(hint.name) ?? namedValues.get("function_id"));
      }

      if (getStructuredKind(hint.type, code) === "master") {
        return valuesToMaster(namedValues.get("secret"), namedValues.get("allowedGuesses"));
      }

      if (structuredKind === "linked-list" && intersectionInput) {
        if (hint.name === "headA" || hint.name === "listA") {
          return intersectionInput.headA;
        }

        if (hint.name === "headB" || hint.name === "listB") {
          return intersectionInput.headB;
        }
      }

      const value = namedValues.has(hint.name) ? namedValues.get(hint.name) : values[index];

      if (structuredKind === "linked-list") {
        return createLinkedListInput(value, hint, namedValues);
      }

      if (structuredKind === "binary-tree") {
        return createBinaryTreeInput(
          resolveBinaryTreeValue(values, index, hint, namedValues),
          hint,
          binaryTreeInputs,
        );
      }

      return transformStructuredValue(value, hint.type, code);
    });
  }

  return values.map((value, index) => {
    const hint =
      typeHints.params.find((param) => param.name === names[index]) ?? typeHints.params[index];

    if (!hint) {
      return value;
    }

    if (getStructuredKind(hint.type, code) === "linked-list") {
      return createLinkedListInput(value, hint, namedValues);
    }

    if (getStructuredKind(hint.type, code) === "binary-tree") {
      return createBinaryTreeInput(value, hint, binaryTreeInputs);
    }

    return transformStructuredValue(value, hint.type, code);
  });
}

export function serializeInputJS(values, code, names = []) {
  const typeHints = getJsTypeHints(code);
  const useFunctionParamOrder = typeHints.params.length > 0 && names.length > 0;
  const outputNames = useFunctionParamOrder ? typeHints.params.map((hint) => hint.name) : names;
  const outputValues = values.map((value, index) => {
    const hint = useFunctionParamOrder
      ? typeHints.params[index]
      : typeHints.params.find((param) => param.name === names[index]) ?? typeHints.params[index];

    return hint ? serializeStructuredValue(value, hint.type, code) : value;
  });

  return { names: outputNames, values: outputValues };
}

export function expectsBinaryTreeNodeValue(expected) {
  return (
    expected?.kind === "value" &&
    expected.value !== null &&
    !Array.isArray(expected.value) &&
    typeof expected.value !== "object"
  );
}

export function transformOutputJS(value, code, fallbackValue, inputNames = [], expected) {
  const { params, returnType } = getJsTypeHints(code);
  const returnKind = getStructuredKind(returnType, code);

  if (
    (fallbackValue?.__runnerCycleInput || inputNames.includes("pos")) &&
    returnKind === "linked-list"
  ) {
    return linkedListNodeIndex(value);
  }

  if (
    (fallbackValue?.__runnerIntersectionHead || inputNames.includes("intersectVal")) &&
    returnKind === "linked-list"
  ) {
    if (!value) {
      return null;
    }

    return value.__runnerIntersectionNode ? value.val : linkedListToArray(value);
  }

  if (returnType === "void") {
    if (fallbackValue?.__runnerHead) {
      return linkedListToArray(fallbackValue.__runnerHead);
    }

    return typeof fallbackValue === "undefined"
      ? undefined
      : serializeStructuredValue(fallbackValue, params[0]?.type, code);
  }

  if (returnKind === "binary-tree" && expectsBinaryTreeNodeValue(expected)) {
    return value?.__runnerBinaryTreeNode ? value.val : null;
  }

  return serializeStructuredValue(value, returnType, code);
}
