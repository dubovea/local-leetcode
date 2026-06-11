import { formatError } from "./runnerValue.js";

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

class Node:
    def __init__(self, val=0, left=None, right=None, next=None, random=None, children=None, neighbors=None):
        self.val = val
        self.left = left
        self.right = right
        self.next = next
        self.random = random
        self.prev = None
        self.child = None
        self.children = children if children is not None else []
        self.neighbors = neighbors if neighbors is not None else []
        self.isLeaf = False
        self.topLeft = None
        self.topRight = None
        self.bottomLeft = None
        self.bottomRight = None

_Node = Node

class Employee:
    def __init__(self, id=0, importance=0, subordinates=None):
        self.id = id
        self.importance = importance
        self.subordinates = subordinates if subordinates is not None else []

class NestedInteger:
    def __init__(self, value=None):
        self.integer = None
        self.list = []
        if isinstance(value, int):
            self.integer = value
        elif isinstance(value, list):
            self.list = [NestedInteger(item) for item in value]

    def isInteger(self):
        return self.integer is not None

    def getInteger(self):
        return self.integer

    def setInteger(self, value):
        self.integer = value
        self.list = []

    def add(self, elem):
        if self.integer is not None:
            self.integer = None
            self.list = []
        self.list.append(elem)

    def getList(self):
        return self.list

class Iterator:
    def __init__(self, values=None):
        self.values = values if values is not None else []
        self.index = 0

    def next(self):
        value = self.values[self.index]
        self.index += 1
        return value

    def hasNext(self):
        return self.index < len(self.values)

class MountainArray:
    def __init__(self, values=None):
        self.values = values if values is not None else []

    def get(self, index):
        return self.values[index]

    def length(self):
        return len(self.values)

class CustomFunction:
    def __init__(self, function_id=1):
        self.function_id = function_id

    def f(self, x, y):
        return x + y if self.function_id == 1 else x * y

class Master:
    def __init__(self, secret="", allowed_guesses=10):
        self.secret = secret
        self.allowed_guesses = allowed_guesses
        self.guesses = 0

    def guess(self, word):
        self.guesses += 1
        if self.guesses > self.allowed_guesses:
            return -1
        return sum(1 for left, right in zip(word, self.secret) if left == right)

def __medik_array_to_linked_list(values):
    if not isinstance(values, list):
        return values
    dummy = ListNode()
    current = dummy
    for value in values:
        current.next = ListNode(value)
        current = current.next
    return dummy.next

def __medik_linked_list_to_array(head):
    result = []
    seen = set()
    current = head
    while current is not None and id(current) not in seen:
        seen.add(id(current))
        result.append(current.val)
        current = current.next
    return result

def __medik_array_to_binary_tree(values, node_class=TreeNode):
    if not isinstance(values, list) or len(values) == 0 or values[0] is None:
        return None
    root = node_class(values[0])
    root.__runner_binary_tree_node = True
    queue = [root]
    index = 1
    while queue and index < len(values):
        node = queue.pop(0)
        left_value = values[index]
        index += 1
        if left_value is not None:
            node.left = node_class(left_value)
            node.left.__runner_binary_tree_node = True
            queue.append(node.left)
        if index >= len(values):
            break
        right_value = values[index]
        index += 1
        if right_value is not None:
            node.right = node_class(right_value)
            node.right.__runner_binary_tree_node = True
            queue.append(node.right)
    return root

def __medik_find_binary_tree_node(root, value):
    queue = [root] if root is not None else []
    while queue:
        node = queue.pop(0)
        if node is None:
            continue
        if node.val == value:
            return node
        queue.append(getattr(node, "left", None))
        queue.append(getattr(node, "right", None))
    return None

def __medik_binary_tree_to_array(root):
    if root is None:
        return []
    result = []
    queue = [root]
    while queue:
        node = queue.pop(0)
        if node is None:
            result.append(None)
            continue
        result.append(node.val)
        queue.append(getattr(node, "left", None))
        queue.append(getattr(node, "right", None))
    while result and result[-1] is None:
        result.pop()
    return result

def __medik_binary_tree_next_to_array(root):
    if root is None:
        return []
    result = []
    level_start = root
    while level_start is not None:
        current = level_start
        next_level_start = None
        while current is not None:
            result.append(current.val)
            if next_level_start is None:
                next_level_start = getattr(current, "left", None) or getattr(current, "right", None)
            current = getattr(current, "next", None)
        result.append("#")
        level_start = next_level_start
    return result

def __medik_array_to_nary_tree(values):
    if not isinstance(values, list) or len(values) == 0 or values[0] is None:
        return None
    root = Node(values[0], children=[])
    queue = [root]
    parent = queue.pop(0)
    for value in values[2:]:
        if value is None:
            parent = queue.pop(0) if queue else None
            continue
        child = Node(value, children=[])
        if parent is not None:
            parent.children.append(child)
        queue.append(child)
    return root

def __medik_nary_tree_to_array(root):
    if root is None:
        return []
    result = [root.val, None]
    queue = [root]
    while queue:
        node = queue.pop(0)
        for child in getattr(node, "children", []) or []:
            result.append(child.val)
            queue.append(child)
        if queue:
            result.append(None)
    while result and result[-1] is None:
        result.pop()
    return result

def __medik_array_to_graph(adj_list):
    if not isinstance(adj_list, list) or len(adj_list) == 0:
        return None
    nodes = [Node(index + 1, neighbors=[]) for index in range(len(adj_list))]
    for index, neighbors in enumerate(adj_list):
        nodes[index].neighbors = [nodes[value - 1] for value in neighbors]
    return nodes[0]

def __medik_graph_to_array(node):
    if node is None:
        return []
    queue = [node]
    seen = {id(node)}
    by_value = {}
    while queue:
        current = queue.pop(0)
        by_value[current.val] = current
        for neighbor in getattr(current, "neighbors", []) or []:
            if id(neighbor) not in seen:
                seen.add(id(neighbor))
                queue.append(neighbor)
    return [[neighbor.val for neighbor in getattr(by_value.get(index), "neighbors", [])] for index in range(1, max(by_value.keys()) + 1)]

def __medik_array_to_random_list(values):
    if not isinstance(values, list):
        return values
    nodes = [Node(item[0]) for item in values]
    for index, item in enumerate(values):
        nodes[index].next = nodes[index + 1] if index + 1 < len(nodes) else None
        nodes[index].random = nodes[item[1]] if len(item) > 1 and isinstance(item[1], int) else None
    return nodes[0] if nodes else None

def __medik_random_list_to_array(head):
    nodes = []
    index_by_id = {}
    current = head
    while current is not None and id(current) not in index_by_id:
        index_by_id[id(current)] = len(nodes)
        nodes.append(current)
        current = current.next
    result = []
    for node in nodes:
        random_index = index_by_id.get(id(node.random)) if getattr(node, "random", None) is not None else None
        result.append([node.val, random_index])
    return result

def __medik_array_to_employees(values):
    return [Employee(item[0], item[1], item[2]) for item in values] if isinstance(values, list) else values

def __medik_nested_integer_to_value(value):
    if isinstance(value, NestedInteger):
        return value.getInteger() if value.isInteger() else [__medik_nested_integer_to_value(item) for item in value.getList()]
    return value

def __medik_transform_value(value, kind):
    if kind == "linked-list":
        return __medik_array_to_linked_list(value)
    if kind == "binary-tree":
        return __medik_array_to_binary_tree(value)
    if kind == "binary-tree-next":
        return __medik_array_to_binary_tree(value, Node)
    if kind == "nary-tree":
        return __medik_array_to_nary_tree(value)
    if kind == "graph":
        return __medik_array_to_graph(value)
    if kind == "random-list":
        return __medik_array_to_random_list(value)
    if kind == "employees":
        return __medik_array_to_employees(value)
    if kind == "nested-integer":
        return [NestedInteger(item) for item in value] if isinstance(value, list) else NestedInteger(value)
    if kind == "iterator":
        return Iterator(value)
    if kind == "mountain-array":
        return MountainArray(value)
    if kind == "custom-function":
        return CustomFunction(value)
    if kind == "master":
        return Master(value.get("secret", ""), value.get("allowedGuesses", 10))
    return value

def __medik_serialize_value(value, kind):
    if kind == "linked-list":
        return __medik_linked_list_to_array(value)
    if kind == "binary-tree":
        return __medik_binary_tree_to_array(value)
    if kind == "binary-tree-node":
        return value.val if getattr(value, "__runner_binary_tree_node", False) else None
    if kind == "binary-tree-next":
        return __medik_binary_tree_next_to_array(value)
    if kind == "nary-tree":
        return __medik_nary_tree_to_array(value)
    if kind == "graph":
        return __medik_graph_to_array(value)
    if kind == "random-list":
        return __medik_random_list_to_array(value)
    if kind == "nested-integer":
        return __medik_nested_integer_to_value(value)
    return value
`;

let pyodidePromise;
let pythonLogsTarget = null;

export function setPythonLogsTarget(logs) {
  pythonLogsTarget = logs;
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

export function destroyPyProxy(value) {
  if (value && typeof value.destroy === "function") {
    value.destroy();
  }
}

export function pythonValueToJs(value) {
  if (value && typeof value.toJs === "function") {
    return value.toJs({ dict_converter: Object.fromEntries });
  }

  return value;
}

export async function compilePythonCode(code, functionName) {
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

    const transformValue = pyodide.runPython("__medik_transform_value", { globals });
    const serializeValue = pyodide.runPython("__medik_serialize_value", { globals });
    const findBinaryTreeNode = pyodide.runPython("__medik_find_binary_tree_node", { globals });

    return { pyodide, globals, solution, transformValue, serializeValue, findBinaryTreeNode };
  } catch (error) {
    destroyPyProxy(globals);
    throw error;
  }
}
