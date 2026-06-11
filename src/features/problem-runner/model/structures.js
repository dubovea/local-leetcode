export class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

export class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

export class Node {
  constructor(val = 0, children = []) {
    this.val = val;
    this.children = Array.isArray(children) ? children : [];
    this.left = null;
    this.right = null;
    this.next = null;
    this.random = null;
    this.prev = null;
    this.child = null;
    this.neighbors = Array.isArray(children) ? children : [];
    this.isLeaf = false;
    this.topLeft = null;
    this.topRight = null;
    this.bottomLeft = null;
    this.bottomRight = null;
  }
}

export class _Node extends Node {
  constructor(val = 0, first = null, second = null, third = null, fourth = null, fifth = null) {
    super(val);

    if (typeof first === "boolean" || arguments.length >= 6) {
      this.val = Boolean(val);
      this.isLeaf = Boolean(first);
      this.topLeft = second ?? null;
      this.topRight = third ?? null;
      this.bottomLeft = fourth ?? null;
      this.bottomRight = fifth ?? null;
      return;
    }

    if (Array.isArray(first)) {
      this.children = first;
      this.neighbors = first;
      return;
    }

    this.left = first ?? null;
    this.right = second ?? null;
    this.next = third ?? first ?? null;
    this.random = second ?? null;
    this.child = third ?? null;
  }
}

export class Employee {
  constructor(id, importance, subordinates = []) {
    this.id = id;
    this.importance = importance;
    this.subordinates = subordinates;
  }
}

export class NestedInteger {
  constructor(value) {
    this.integer = null;
    this.list = [];

    if (typeof value === "number") {
      this.integer = value;
    } else if (Array.isArray(value)) {
      this.list = value.map(arrayToNestedInteger);
    }
  }

  isInteger() {
    return this.integer !== null;
  }

  getInteger() {
    return this.integer;
  }

  setInteger(value) {
    this.integer = value;
    this.list = [];
  }

  add(elem) {
    if (this.integer !== null) {
      this.integer = null;
      this.list = [];
    }

    this.list.push(elem);
  }

  getList() {
    return this.list;
  }
}

export class Iterator {
  constructor(values = []) {
    this.values = Array.isArray(values) ? values : [];
    this.index = 0;
  }

  next() {
    const value = this.values[this.index];
    this.index += 1;
    return value;
  }

  hasNext() {
    return this.index < this.values.length;
  }
}

export class MountainArray {
  constructor(values = []) {
    this.values = Array.isArray(values) ? values : [];
  }

  get(index) {
    return this.values[index];
  }

  length() {
    return this.values.length;
  }
}

export class CustomFunction {
  constructor(functionId = 1) {
    this.functionId = functionId;
  }

  f(x, y) {
    return this.functionId === 1 ? x + y : x * y;
  }
}

export class Master {
  constructor(secret = "", allowedGuesses = Number.POSITIVE_INFINITY) {
    this.secret = secret;
    this.allowedGuesses = allowedGuesses;
    this.guesses = 0;
  }

  guess(word) {
    this.guesses += 1;

    if (this.guesses > this.allowedGuesses) {
      return -1;
    }

    return String(word)
      .split("")
      .reduce((matches, char, index) => matches + (char === this.secret[index] ? 1 : 0), 0);
  }
}

export function arrayToLinkedList(array) {
  if (!Array.isArray(array)) {
    return array;
  }

  const dummy = new ListNode(0);
  let current = dummy;

  for (const value of array) {
    current.next = new ListNode(value);
    current = current.next;
  }

  return dummy.next;
}

function setHiddenProperty(target, name, value) {
  if (target && typeof target === "object") {
    Object.defineProperty(target, name, {
      configurable: true,
      value,
    });
  }
}

function linkedListNodes(head) {
  const nodes = [];
  const seen = new Set();
  let current = head;

  while (current && !seen.has(current)) {
    seen.add(current);
    nodes.push(current);
    current = current.next;
  }

  return nodes;
}

export function arrayToLinkedListWithCycle(array, pos) {
  const head = arrayToLinkedList(array);
  const cycleIndex = Number(pos);

  if (!head) {
    return head;
  }

  const nodes = linkedListNodes(head);

  for (let index = 0; index < nodes.length; index += 1) {
    setHiddenProperty(nodes[index], "__runnerListIndex", index);
    setHiddenProperty(nodes[index], "__runnerCycleInput", true);
  }

  if (!Number.isInteger(cycleIndex) || cycleIndex < 0) {
    return head;
  }

  const cycleNode = nodes[cycleIndex];

  if (!cycleNode) {
    return head;
  }

  nodes[nodes.length - 1].next = cycleNode;

  return head;
}

export function linkedListToArray(head) {
  const result = [];
  const seen = new Set();
  let current = head;

  while (current && !seen.has(current)) {
    seen.add(current);
    result.push(current.val);
    current = current.next;
  }

  return result;
}

export function arrayToMultilevelDoublyList(array) {
  if (!Array.isArray(array) || array.length === 0) {
    return null;
  }

  const segments = [];
  const gaps = [];
  let currentSegment = [];
  let nullCount = 0;

  for (const value of array) {
    if (value === null || typeof value === "undefined") {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }

      nullCount += 1;
      continue;
    }

    if (nullCount > 0) {
      gaps.push(nullCount);
      nullCount = 0;
    }

    currentSegment.push(value);
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  const levels = segments.map((segment) => {
    const nodes = segment.map((value) => new Node(value));

    for (let index = 0; index < nodes.length; index += 1) {
      nodes[index].prev = nodes[index - 1] ?? null;
      nodes[index].next = nodes[index + 1] ?? null;
    }

    return nodes;
  });

  for (let index = 1; index < levels.length; index += 1) {
    const parentLevel = levels[index - 1];
    const parent = parentLevel[(gaps[index - 1] ?? 1) - 1];

    if (parent) {
      parent.child = levels[index][0] ?? null;
      if (parent.child) {
        parent.child.prev = null;
      }
    }
  }

  return levels[0]?.[0] ?? null;
}

export function multilevelDoublyListToArray(head) {
  const result = [];
  const seen = new Set();
  let current = head;

  while (current && !seen.has(current)) {
    seen.add(current);
    result.push(current.val);
    current = current.next;
  }

  return result;
}

export function linkedListNodeIndex(node) {
  return Number.isInteger(node?.__runnerListIndex) ? node.__runnerListIndex : null;
}

export function findLinkedListNode(head, value) {
  return linkedListNodes(head).find((node) => node.val === value) ?? null;
}

function markBinaryTreeNode(node) {
  setHiddenProperty(node, "__runnerBinaryTreeNode", true);
}

export function arrayToIntersectingLinkedLists(listA, listB, skipA, skipB, intersectVal) {
  const headA = arrayToLinkedList(listA);
  const headB = arrayToLinkedList(listB);
  const shouldIntersect = Number(intersectVal) !== 0;

  setHiddenProperty(headA, "__runnerIntersectionHead", true);
  setHiddenProperty(headB, "__runnerIntersectionHead", true);

  if (!shouldIntersect) {
    return { headA, headB, intersectionNode: null };
  }

  const nodesA = linkedListNodes(headA);
  const nodesB = linkedListNodes(headB);
  const intersectionNode = nodesA[Number(skipA)];

  if (!intersectionNode) {
    return { headA, headB, intersectionNode: null };
  }

  setHiddenProperty(intersectionNode, "__runnerIntersectionNode", true);

  if (Number(skipB) === 0) {
    setHiddenProperty(intersectionNode, "__runnerIntersectionHead", true);
    return { headA, headB: intersectionNode, intersectionNode };
  }

  const previousB = nodesB[Number(skipB) - 1];

  if (previousB) {
    previousB.next = intersectionNode;
  }

  return { headA, headB, intersectionNode };
}

export function arrayToRandomList(array) {
  if (!Array.isArray(array)) {
    return array;
  }

  const nodes = array.map(([value]) => new _Node(value));

  for (let index = 0; index < nodes.length; index += 1) {
    const [, randomIndex] = array[index];

    nodes[index].next = nodes[index + 1] ?? null;
    nodes[index].random = typeof randomIndex === "number" ? nodes[randomIndex] : null;
  }

  return nodes[0] ?? null;
}

export function randomListToArray(head) {
  const nodes = [];
  const indexByNode = new Map();
  let current = head;

  while (current && !indexByNode.has(current)) {
    indexByNode.set(current, nodes.length);
    nodes.push(current);
    current = current.next;
  }

  return nodes.map((node) => [
    node.val,
    node.random && indexByNode.has(node.random) ? indexByNode.get(node.random) : null,
  ]);
}

export function arrayToBinaryTree(array, NodeClass = TreeNode) {
  if (!Array.isArray(array) || array.length === 0 || array[0] === null) {
    return null;
  }

  const root = new NodeClass(array[0]);
  markBinaryTreeNode(root);
  const queue = [root];
  let index = 1;

  while (queue.length > 0 && index < array.length) {
    const node = queue.shift();

    if (!node) {
      continue;
    }

    const leftValue = array[index];
    index += 1;

    if (leftValue !== null && typeof leftValue !== "undefined") {
      node.left = new NodeClass(leftValue);
      markBinaryTreeNode(node.left);
      queue.push(node.left);
    }

    if (index >= array.length) {
      break;
    }

    const rightValue = array[index];
    index += 1;

    if (rightValue !== null && typeof rightValue !== "undefined") {
      node.right = new NodeClass(rightValue);
      markBinaryTreeNode(node.right);
      queue.push(node.right);
    }
  }

  return root;
}

export function findBinaryTreeNode(root, value) {
  const queue = root ? [root] : [];

  while (queue.length > 0) {
    const node = queue.shift();

    if (!node) {
      continue;
    }

    if (Object.is(node.val, value)) {
      return node;
    }

    queue.push(node.left ?? null);
    queue.push(node.right ?? null);
  }

  return null;
}

export function binaryTreeToArray(root) {
  if (!root) {
    return [];
  }

  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const node = queue.shift();

    if (!node) {
      result.push(null);
      continue;
    }

    result.push(node.val);
    queue.push(node.left ?? null);
    queue.push(node.right ?? null);
  }

  while (result.length > 0 && result[result.length - 1] === null) {
    result.pop();
  }

  return result;
}

export function binaryTreeNextToArray(root) {
  if (!root) {
    return [];
  }

  const result = [];
  let levelStart = root;

  while (levelStart) {
    let current = levelStart;
    let nextLevelStart = null;

    while (current) {
      result.push(current.val);

      if (!nextLevelStart) {
        nextLevelStart = current.left ?? current.right ?? null;
      }

      current = current.next;
    }

    result.push("#");
    levelStart = nextLevelStart;
  }

  return result;
}

export function arrayToNaryTree(array) {
  if (!Array.isArray(array) || array.length === 0 || array[0] === null) {
    return null;
  }

  const root = new _Node(array[0], []);
  const queue = [root];
  let parent = queue.shift();

  for (let index = 2; index < array.length; index += 1) {
    const value = array[index];

    if (value === null) {
      parent = queue.shift();
      continue;
    }

    const child = new _Node(value, []);
    parent?.children.push(child);
    queue.push(child);
  }

  return root;
}

export function naryTreeToArray(root) {
  if (!root) {
    return [];
  }

  const result = [root.val, null];
  const queue = [root];

  while (queue.length > 0) {
    const node = queue.shift();

    for (const child of node.children ?? []) {
      result.push(child.val);
      queue.push(child);
    }

    if (queue.length > 0) {
      result.push(null);
    }
  }

  while (result.length > 0 && result[result.length - 1] === null) {
    result.pop();
  }

  return result;
}

export function arrayToGraph(adjList) {
  if (!Array.isArray(adjList) || adjList.length === 0) {
    return null;
  }

  const nodes = adjList.map((_, index) => new _Node(index + 1, []));

  for (let index = 0; index < adjList.length; index += 1) {
    nodes[index].neighbors = adjList[index].map((neighborValue) => nodes[neighborValue - 1]);
  }

  return nodes[0];
}

export function graphToArray(node) {
  if (!node) {
    return [];
  }

  const queue = [node];
  const seen = new Set([node]);
  const nodesByValue = new Map();

  while (queue.length > 0) {
    const current = queue.shift();
    nodesByValue.set(current.val, current);

    for (const neighbor of current.neighbors ?? []) {
      if (!seen.has(neighbor)) {
        seen.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  const maxValue = Math.max(...nodesByValue.keys());

  return Array.from({ length: maxValue }, (_, index) => {
    const current = nodesByValue.get(index + 1);

    return current ? (current.neighbors ?? []).map((neighbor) => neighbor.val) : [];
  });
}

export function arrayToQuadTree(array) {
  if (!Array.isArray(array) || array.length === 0 || array[0] === null) {
    return null;
  }

  function createNode(value) {
    if (!Array.isArray(value)) {
      return null;
    }

    const [isLeaf, val] = value;
    return new _Node(Boolean(val), Boolean(isLeaf));
  }

  const root = createNode(array[0]);
  const queue = [root];
  let index = 1;

  while (queue.length > 0 && index < array.length) {
    const node = queue.shift();

    if (!node) {
      continue;
    }

    const children = array.slice(index, index + 4).map(createNode);
    index += 4;
    [node.topLeft, node.topRight, node.bottomLeft, node.bottomRight] = children;
    queue.push(...children.filter(Boolean));
  }

  return root;
}

export function quadTreeToArray(root) {
  if (!root) {
    return [];
  }

  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const node = queue.shift();

    if (!node) {
      result.push(null);
      continue;
    }

    result.push([node.isLeaf ? 1 : 0, node.val ? 1 : 0]);

    if (!node.isLeaf) {
      queue.push(
        node.topLeft ?? null,
        node.topRight ?? null,
        node.bottomLeft ?? null,
        node.bottomRight ?? null,
      );
    }
  }

  while (result.length > 0 && result[result.length - 1] === null) {
    result.pop();
  }

  return result;
}

export function arrayToEmployees(array) {
  return Array.isArray(array)
    ? array.map(([id, importance, subordinates]) => new Employee(id, importance, subordinates))
    : array;
}

export function arrayToNestedInteger(value) {
  return new NestedInteger(value);
}

export function nestedIntegerToValue(value) {
  if (value instanceof NestedInteger) {
    return value.isInteger() ? value.getInteger() : value.getList().map(nestedIntegerToValue);
  }

  return value;
}

export function arrayToIterator(value) {
  return new Iterator(value);
}

export function arrayToMountainArray(value) {
  return new MountainArray(value);
}

export function valueToCustomFunction(value) {
  return new CustomFunction(value);
}

export function valuesToMaster(secret, allowedGuesses) {
  return new Master(secret, allowedGuesses);
}
