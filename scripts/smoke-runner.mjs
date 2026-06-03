import {
  runUserCode,
  parseInputAssignments,
} from "../src/features/problem-runner/model/runnerCore.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const parsed = parseInputAssignments('strs =\n["eat","tea","tan","ate","nat","bat"]');
assert(parsed.names[0] === "strs", "input parser should read LeetCode multiline values");
assert(parsed.values[0].length === 6, "input parser should read array values");

const parsedComma = parseInputAssignments("nums = [2,7,11,15], target = 9");
assert(parsedComma.names.length === 2, "input parser should read comma-separated assignments");
assert(parsedComma.values[1] === 9, "input parser should read second comma-separated value");

const groupAnagramsCode = `/**
 * @param {string[]} strs
 * @return {string[][]}
 */
var groupAnagrams = function (strs) {
  const groups = new Map();

  for (const word of strs) {
    const key = word.split("").sort().join("");
    const group = groups.get(key);

    if (group) {
      group.push(word);
    } else {
      groups.set(key, [word]);
    }
  }

  return [...groups.values()];
};`;

const accepted = await runUserCode({
  code: groupAnagramsCode,
  functionName: "groupAnagrams",
  judgeMode: "unordered-array",
  testCases: [
    {
      id: "1",
      input: 'strs =\n["eat","tea","tan","ate","nat","bat"]',
      expected: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
    },
    { id: "2", input: 'strs =\n[""]', expected: '[[""]]' },
    { id: "3", input: 'strs =\n["a"]', expected: '[["a"]]' },
  ],
});

assert(accepted.status === "accepted", `expected accepted, got ${accepted.status}`);
assert(accepted.passedCount === 3, "expected all cases to pass");
assert(
  Math.abs(
    accepted.durationMs -
      accepted.cases.reduce((total, testCase) => total + testCase.durationMs, 0),
  ) < 0.001,
  "accepted runtime should be the sum of solution runtimes only",
);
assert(Number.isFinite(accepted.memoryBytes), "accepted result should include memory usage");

const wrongAnswer = await runUserCode({
  code: "var groupAnagrams = function () { return []; };",
  functionName: "groupAnagrams",
  judgeMode: "unordered-array",
  testCases: [
    {
      id: "1",
      input: 'strs =\n["eat","tea","tan","ate","nat","bat"]',
      expected: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
    },
  ],
});

assert(wrongAnswer.status === "wrong-answer", `expected wrong-answer, got ${wrongAnswer.status}`);

const removeElementAccepted = await runUserCode({
  code: `/**
 * @param {number[]} nums
 * @param {number} val
 * @return {number}
 */
var removeElement = function (nums, val) {
  let k = 0;

  for (let i = 0; i < nums.length; i += 1) {
    if (nums[i] !== val) {
      nums[k] = nums[i];
      k += 1;
    }
  }

  for (let i = k; i < nums.length; i += 1) {
    nums[i] = undefined;
  }

  return k;
};`,
  functionName: "removeElement",
  judgeMode: "exact",
  testCases: [
    {
      id: "1",
      input: "nums = [0,1,2,2,3,0,4,2], val = 2",
      expected: "5, nums = [0,1,4,0,3,_,_,_]",
    },
  ],
});

assert(
  removeElementAccepted.status === "accepted",
  `expected Remove Element custom judge accepted, got ${removeElementAccepted.status}`,
);

const busyAccepted = await runUserCode({
  code: `var spin = function () {
  const startedAt = performance.now();

  while (performance.now() - startedAt < 3) {}

  return 1;
};`,
  functionName: "spin",
  judgeMode: "exact",
  testCases: [{ id: "1", input: "", expected: "1" }],
});

assert(busyAccepted.status === "accepted", "busy accepted probe should pass");
assert(busyAccepted.durationMs > 0, "accepted runtime should reflect measured user-code time");

const linkedListAccepted = await runUserCode({
  code: `/**
 * @param {ListNode} l1
 * @param {ListNode} l2
 * @return {ListNode}
 */
var addTwoNumbers = function (l1, l2) {
  const dummy = new ListNode();
  let current = dummy;
  let carry = 0;

  while (l1 || l2 || carry) {
    const sum = (l1?.val ?? 0) + (l2?.val ?? 0) + carry;
    carry = Math.floor(sum / 10);
    current.next = new ListNode(sum % 10);
    current = current.next;
    l1 = l1?.next ?? null;
    l2 = l2?.next ?? null;
  }

  return dummy.next;
};`,
  functionName: "addTwoNumbers",
  judgeMode: "exact",
  testCases: [{ id: "1", input: "l1 = [2,4,3], l2 = [5,6,4]", expected: "[7,0,8]" }],
});

assert(
  linkedListAccepted.status === "accepted",
  `expected linked-list solution accepted, got ${linkedListAccepted.status}`,
);

const mergeTwoListsAccepted = await runUserCode({
  code: `/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
var mergeTwoLists = function (list1, list2) {
  const dummy = new ListNode();
  let current = dummy;
  let p1 = list1;
  let p2 = list2;

  while (p1 && p2) {
    if (p1.val < p2.val) {
      current.next = p1;
      p1 = p1.next;
    } else {
      current.next = p2;
      p2 = p2.next;
    }

    current = current.next;
  }

  current.next = p1 ?? p2;
  return dummy.next;
};`,
  functionName: "mergeTwoLists",
  judgeMode: "exact",
  testCases: [
    { id: "1", input: "list1 = [1,2,4], list2 = [1,3,4]", expected: "[1,1,2,3,4,4]" },
    { id: "2", input: "list1 = [], list2 = []", expected: "[]" },
    { id: "3", input: "list1 = [], list2 = [0]", expected: "[0]" },
  ],
});

assert(
  mergeTwoListsAccepted.status === "accepted",
  `expected Merge Two Sorted Lists accepted, got ${mergeTwoListsAccepted.status}`,
);

const linkedListCycleAccepted = await runUserCode({
  code: `/**
 * @param {ListNode} head
 * @return {boolean}
 */
var hasCycle = function (head) {
  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      return true;
    }
  }

  return false;
};`,
  functionName: "hasCycle",
  judgeMode: "exact",
  testCases: [
    { id: "1", input: "head = [3,2,0,-4], pos = 1", expected: "true" },
    { id: "2", input: "head = [1,2], pos = 0", expected: "true" },
    { id: "3", input: "head = [1], pos = -1", expected: "false" },
  ],
});

assert(
  linkedListCycleAccepted.status === "accepted",
  `expected Linked List Cycle accepted, got ${linkedListCycleAccepted.status}`,
);

const linkedListCycleTwoAccepted = await runUserCode({
  code: `/**
 * @param {ListNode} head
 * @return {ListNode}
 */
var detectCycle = function (head) {
  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      let current = head;

      while (current !== slow) {
        current = current.next;
        slow = slow.next;
      }

      return current;
    }
  }

  return null;
};`,
  functionName: "detectCycle",
  judgeMode: "exact",
  testCases: [
    { id: "1", input: "head = [3,2,0,-4], pos = 1", expected: "tail connects to node index 1" },
    { id: "2", input: "head = [1,2], pos = 0", expected: "tail connects to node index 0" },
    { id: "3", input: "head = [1], pos = -1", expected: "no cycle" },
    { id: "4", input: "head = [], pos = -1", expected: "no cycle" },
  ],
});

assert(
  linkedListCycleTwoAccepted.status === "accepted",
  `expected Linked List Cycle II accepted, got ${linkedListCycleTwoAccepted.status}`,
);

const intersectionAccepted = await runUserCode({
  code: `/**
 * @param {ListNode} headA
 * @param {ListNode} headB
 * @return {ListNode}
 */
var getIntersectionNode = function (headA, headB) {
  const seen = new Set();

  while (headA) {
    seen.add(headA);
    headA = headA.next;
  }

  while (headB) {
    if (seen.has(headB)) {
      return headB;
    }

    headB = headB.next;
  }

  return null;
};`,
  functionName: "getIntersectionNode",
  judgeMode: "exact",
  testCases: [
    {
      id: "1",
      input: "intersectVal = 8, listA = [4,1,8,4,5], listB = [5,6,1,8,4,5], skipA = 2, skipB = 3",
      expected: "Intersected at '8'",
    },
    {
      id: "2",
      input: "intersectVal = 0, listA = [2,6,4], listB = [1,5], skipA = 3, skipB = 2",
      expected: "No intersection",
    },
  ],
});

assert(
  intersectionAccepted.status === "accepted",
  `expected intersection linked-list case accepted, got ${intersectionAccepted.status}`,
);

const deleteNodeAccepted = await runUserCode({
  code: `/**
 * @param {ListNode} node
 * @return {void}
 */
var deleteNode = function (node) {
  node.val = node.next.val;
  node.next = node.next.next;
};`,
  functionName: "deleteNode",
  judgeMode: "exact",
  testCases: [
    { id: "1", input: "head = [4,5,1,9], node = 5", expected: "[4,1,9]" },
    { id: "2", input: "head = [4,5,1,9], node = 1", expected: "[4,5,9]" },
  ],
});

assert(
  deleteNodeAccepted.status === "accepted",
  `expected delete-node linked-list case accepted, got ${deleteNodeAccepted.status}`,
);

const treeAccepted = await runUserCode({
  code: `/**
 * @param {TreeNode} root
 * @return {TreeNode}
 */
var invertTree = function (root) {
  if (!root) {
    return root;
  }

  const left = invertTree(root.left);
  root.left = invertTree(root.right);
  root.right = left;

  return root;
};`,
  functionName: "invertTree",
  judgeMode: "exact",
  testCases: [
    {
      id: "1",
      input: "root = [4,2,7,1,3,6,9]",
      expected: "[4,7,2,9,6,3,1]",
    },
  ],
});

assert(
  treeAccepted.status === "accepted",
  `expected tree solution accepted, got ${treeAccepted.status}`,
);

const nextPointerAccepted = await runUserCode({
  code: `/**
 * @param {_Node} root
 * @return {_Node}
 */
var connect = function (root) {
  if (!root) {
    return root;
  }

  const queue = [root];

  while (queue.length > 0) {
    const size = queue.length;
    let previous = null;

    for (let index = 0; index < size; index += 1) {
      const node = queue.shift();

      if (previous) {
        previous.next = node;
      }

      previous = node;

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }

  return root;
};`,
  functionName: "connect",
  judgeMode: "exact",
  testCases: [
    {
      id: "1",
      input: "root = [1,2,3,4,5,6,7]",
      expected: "[1,#,2,3,#,4,5,6,7,#]",
    },
  ],
});

assert(
  nextPointerAccepted.status === "accepted",
  `expected next-pointer tree solution accepted, got ${nextPointerAccepted.status}`,
);

const graphAccepted = await runUserCode({
  code: `/**
 * @param {_Node} node
 * @return {_Node}
 */
var cloneGraph = function (node) {
  const clones = new Map();

  function clone(current) {
    if (!current) {
      return current;
    }

    if (!clones.has(current)) {
      clones.set(current, new _Node(current.val, []));
      clones.get(current).neighbors = current.neighbors.map(clone);
    }

    return clones.get(current);
  }

  return clone(node);
};`,
  functionName: "cloneGraph",
  judgeMode: "exact",
  testCases: [
    {
      id: "1",
      input: "node = [[2,4],[1,3],[2,4],[1,3]]",
      expected: "[[2,4],[1,3],[2,4],[1,3]]",
    },
  ],
});

assert(
  graphAccepted.status === "accepted",
  `expected graph solution accepted, got ${graphAccepted.status}`,
);

const randomListAccepted = await runUserCode({
  code: `/**
 * @param {_Node} head
 * @return {_Node}
 */
var copyRandomList = function (head) {
  const clones = new Map([[null, null]]);
  let current = head;

  while (current) {
    clones.set(current, new _Node(current.val));
    current = current.next;
  }

  current = head;

  while (current) {
    clones.get(current).next = clones.get(current.next);
    clones.get(current).random = clones.get(current.random);
    current = current.next;
  }

  return clones.get(head);
};`,
  functionName: "copyRandomList",
  judgeMode: "exact",
  testCases: [
    {
      id: "1",
      input: "head = [[7,null],[13,0],[11,4],[10,2],[1,0]]",
      expected: "[[7,null],[13,0],[11,4],[10,2],[1,0]]",
    },
  ],
});

assert(
  randomListAccepted.status === "accepted",
  `expected random-list solution accepted, got ${randomListAccepted.status}`,
);

const multilevelDoublyListAccepted = await runUserCode({
  code: `/**
 * @param {Node} head
 * @return {Node}
 */
var flatten = function (head) {
  let current = head;
  const stack = [];

  while (current) {
    if (current.child) {
      if (current.next) {
        stack.push(current.next);
      }

      current.next = current.child;
      current.next.prev = current;
      current.child = null;
    }

    if (!current.next && stack.length > 0) {
      current.next = stack.pop();
      current.next.prev = current;
    }

    current = current.next;
  }

  return head;
};`,
  functionName: "flatten",
  judgeMode: "exact",
  testCases: [
    {
      id: "1",
      input: "head = [1,2,3,4,5,6,null,null,null,7,8,9,10,null,null,11,12]",
      expected: "[1,2,3,7,8,11,12,9,10,4,5,6]",
    },
    { id: "2", input: "head = [1,2,null,3]", expected: "[1,3,2]" },
    { id: "3", input: "head = []", expected: "[]" },
  ],
});

assert(
  multilevelDoublyListAccepted.status === "accepted",
  `expected multilevel doubly linked-list solution accepted, got ${multilevelDoublyListAccepted.status}`,
);

const naryAccepted = await runUserCode({
  code: `/**
 * @param {_Node|null} root
 * @return {number[]}
 */
var preorder = function (root) {
  const result = [];

  function walk(node) {
    if (!node) {
      return;
    }

    result.push(node.val);

    for (const child of node.children ?? []) {
      walk(child);
    }
  }

  walk(root);
  return result;
};`,
  functionName: "preorder",
  judgeMode: "exact",
  testCases: [
    {
      id: "1",
      input: "root = [1,null,3,2,4,null,5,6]",
      expected: "[1,3,5,6,2,4]",
    },
  ],
});

assert(
  naryAccepted.status === "accepted",
  `expected n-ary solution accepted, got ${naryAccepted.status}`,
);

const employeeAccepted = await runUserCode({
  code: `/**
 * @param {Employee[]} employees
 * @param {number} id
 * @return {number}
 */
var GetImportance = function (employees, id) {
  const byId = new Map(employees.map((employee) => [employee.id, employee]));

  function dfs(employeeId) {
    const employee = byId.get(employeeId);
    return employee.importance + employee.subordinates.reduce((total, childId) => total + dfs(childId), 0);
  }

  return dfs(id);
};`,
  functionName: "GetImportance",
  judgeMode: "exact",
  testCases: [
    {
      id: "1",
      input: "employees = [[1,5,[2,3]],[2,3,[]],[3,3,[]]], id = 1",
      expected: "11",
    },
  ],
});

assert(
  employeeAccepted.status === "accepted",
  `expected employee solution accepted, got ${employeeAccepted.status}`,
);

const nestedIntegerAccepted = await runUserCode({
  code: `/**
 * @param {string} s
 * @return {NestedInteger}
 */
var deserialize = function (s) {
  return new NestedInteger(JSON.parse(s));
};`,
  functionName: "deserialize",
  judgeMode: "exact",
  testCases: [{ id: "1", input: 's = "[123,[456,[789]]]"', expected: "[123,[456,[789]]]" }],
});

assert(
  nestedIntegerAccepted.status === "accepted",
  `expected NestedInteger solution accepted, got ${nestedIntegerAccepted.status}`,
);

const mountainArrayAccepted = await runUserCode({
  code: `/**
 * @param {number} target
 * @param {MountainArray} mountainArr
 * @return {number}
 */
var findInMountainArray = function (target, mountainArr) {
  for (let index = 0; index < mountainArr.length(); index += 1) {
    if (mountainArr.get(index) === target) {
      return index;
    }
  }

  return -1;
};`,
  functionName: "findInMountainArray",
  judgeMode: "exact",
  testCases: [
    {
      id: "1",
      input: "mountainArr = [1,2,3,4,5,3,1], target = 3",
      expected: "2",
    },
  ],
});

assert(
  mountainArrayAccepted.status === "accepted",
  `expected MountainArray solution accepted, got ${mountainArrayAccepted.status}`,
);

const customFunctionAccepted = await runUserCode({
  code: `/**
 * @param {CustomFunction} customfunction
 * @param {integer} z
 * @return {integer[][]}
 */
var findSolution = function (customfunction, z) {
  const result = [];

  for (let x = 1; x <= z; x += 1) {
    for (let y = 1; y <= z; y += 1) {
      if (customfunction.f(x, y) === z) {
        result.push([x, y]);
      }
    }
  }

  return result;
};`,
  functionName: "findSolution",
  judgeMode: "exact",
  testCases: [{ id: "1", input: "function_id = 1, z = 5", expected: "[[1,4],[2,3],[3,2],[4,1]]" }],
});

assert(
  customFunctionAccepted.status === "accepted",
  `expected CustomFunction solution accepted, got ${customFunctionAccepted.status}`,
);

const designAccepted = await runUserCode({
  code: `var Counter = function (initialValue) {
  this.value = initialValue;
};

Counter.prototype.add = function (value) {
  this.value += value;
  return this.value;
};

Counter.prototype.get = function () {
  return this.value;
};`,
  functionName: "Counter",
  judgeMode: "exact",
  testCases: [
    {
      id: "1",
      input: 'operations = ["Counter","add","add","get"], arguments = [[1],[4],[5],[]]',
      expected: "[null,5,10,10]",
    },
  ],
});

assert(
  designAccepted.status === "accepted",
  `expected design/class case accepted, got ${designAccepted.status}`,
);

const linkedListDesignAccepted = await runUserCode({
  code: `var MyLinkedList = function () {
  this.head = null;
  this.size = 0;
};

MyLinkedList.prototype.get = function (index) {
  if (index < 0 || index >= this.size) return -1;
  let current = this.head;

  for (let i = 0; i < index; i += 1) {
    current = current.next;
  }

  return current.val;
};

MyLinkedList.prototype.addAtHead = function (val) {
  this.addAtIndex(0, val);
};

MyLinkedList.prototype.addAtTail = function (val) {
  this.addAtIndex(this.size, val);
};

MyLinkedList.prototype.addAtIndex = function (index, val) {
  if (index < 0 || index > this.size) return;

  this.size += 1;

  if (index === 0) {
    this.head = { val, next: this.head };
    return;
  }

  let previous = this.head;

  for (let i = 0; i < index - 1; i += 1) {
    previous = previous.next;
  }

  previous.next = { val, next: previous.next };
};

MyLinkedList.prototype.deleteAtIndex = function (index) {
  if (index < 0 || index >= this.size) return;

  if (index === 0) {
    this.head = this.head.next;
  } else {
    let previous = this.head;

    for (let i = 0; i < index - 1; i += 1) {
      previous = previous.next;
    }

    previous.next = previous.next.next;
  }

  this.size -= 1;
};`,
  functionName: "MyLinkedList",
  judgeMode: "exact",
  testCases: [
    {
      id: "1",
      input: 'operations = ["MyLinkedList", "addAtHead", "addAtTail", "addAtIndex", "get", "deleteAtIndex", "get"], arguments = [[], [1], [3], [1, 2], [1], [1], [1]]',
      expected: "[null, null, null, null, 2, null, 3]",
    },
  ],
});

assert(
  linkedListDesignAccepted.status === "accepted",
  `expected Design Linked List accepted, got ${linkedListDesignAccepted.status}`,
);

const randomNodeDesignAccepted = await runUserCode({
  code: `/**
 * @param {ListNode} head
 */
var Solution = function (head) {
  this.values = [];

  while (head) {
    this.values.push(head.val);
    head = head.next;
  }
};

/**
 * @return {number}
 */
Solution.prototype.getRandom = function () {
  return this.values[0];
};`,
  functionName: "Solution",
  judgeMode: "exact",
  testCases: [
    {
      id: "1",
      input: 'operations = ["Solution", "getRandom", "getRandom", "getRandom", "getRandom", "getRandom"], arguments = [[[1, 2, 3]], [], [], [], [], []]',
      expected: "[null, 1, 3, 2, 2, 3]",
    },
  ],
});

assert(
  randomNodeDesignAccepted.status === "accepted",
  `expected linked-list random-node design case accepted, got ${randomNodeDesignAccepted.status}`,
);

for (const language of ["c-wasm", "csharp-wasm", "cpp-wasm", "go-wasm"]) {
  const unsupportedWasmLanguage = await runUserCode({
    code: "int groupAnagrams(void) { return 0; }",
    language,
    functionName: "groupAnagrams",
    judgeMode: "unordered-array",
    testCases: [
      {
        id: "1",
        input: 'strs =\n["eat","tea","tan","ate","nat","bat"]',
        expected: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
      },
    ],
  });

  assert(
    unsupportedWasmLanguage.status === "runtime-error",
    `expected runtime-error for unsupported ${language} source, got ${unsupportedWasmLanguage.status}`,
  );
}

const runtimeError = await runUserCode({
  code: "var groupAnagrams = function () { throw new Error('boom'); };",
  functionName: "groupAnagrams",
  judgeMode: "unordered-array",
  testCases: [{ id: "1", input: 'strs = ["a"]', expected: '[["a"]]' }],
});

assert(
  runtimeError.status === "runtime-error",
  `expected runtime-error, got ${runtimeError.status}`,
);

const delayedRuntimeError = await runUserCode({
  code: `var failSlow = function () {
  const startedAt = performance.now();

  while (performance.now() - startedAt < 5) {}

  throw new Error("boom");
};`,
  functionName: "failSlow",
  judgeMode: "exact",
  testCases: [{ id: "1", input: "", expected: "undefined" }],
});

assert(
  delayedRuntimeError.cases[0].durationMs > 0,
  "runtime errors should keep measured solution runtime",
);

const smallMemory = await runUserCode({
  code: "var memoryProbe = function () { return [1]; };",
  functionName: "memoryProbe",
  judgeMode: "exact",
  testCases: [{ id: "1", input: "", expected: "[1]" }],
});
const largeOutput = Array.from({ length: 1000 }, (_, index) => index);
const largeMemory = await runUserCode({
  code: "var memoryProbe = function () { return Array.from({ length: 1000 }, (_, index) => index); };",
  functionName: "memoryProbe",
  judgeMode: "exact",
  testCases: [{ id: "1", input: "", expected: JSON.stringify(largeOutput) }],
});

assert(smallMemory.status === "accepted", "small memory probe should be accepted");
assert(largeMemory.status === "accepted", "large memory probe should be accepted");
assert(
  largeMemory.memoryBytes > smallMemory.memoryBytes,
  "memory usage should grow for larger retained output",
);

const smallTemporaryMemory = await runUserCode({
  code: "var memoryProbe = function () { return 1; };",
  functionName: "memoryProbe",
  judgeMode: "exact",
  testCases: [{ id: "1", input: "", expected: "1" }],
});
const largeTemporaryMemory = await runUserCode({
  code: `var memoryProbe = function () {
  const values = Array.from({ length: 5000 }, (_, index) => index);
  const seen = new Map(values.map((value) => [value, value]));

  return seen.get(1);
};`,
  functionName: "memoryProbe",
  judgeMode: "exact",
  testCases: [{ id: "1", input: "", expected: "1" }],
});

assert(
  largeTemporaryMemory.memoryBytes > smallTemporaryMemory.memoryBytes,
  "memory usage should include tracked temporary Array/Map allocations",
);

const originalMemoryDescriptor = Object.getOwnPropertyDescriptor(performance, "memory");

Object.defineProperty(performance, "memory", {
  configurable: true,
  value: { usedJSHeapSize: 1000 },
});

const heapMeasuredMemory = await runUserCode({
  code: `var memoryProbe = function () {
  performance.memory.usedJSHeapSize += 4096;

  return [1];
};`,
  functionName: "memoryProbe",
  judgeMode: "exact",
  testCases: [{ id: "1", input: "", expected: "[1]" }],
});

if (originalMemoryDescriptor) {
  Object.defineProperty(performance, "memory", originalMemoryDescriptor);
} else {
  Reflect.deleteProperty(performance, "memory");
}

assert(
  heapMeasuredMemory.memoryBytes >= 4096,
  "memory usage should prefer measured heap delta when available",
);

const originalMeasureUserAgentSpecificMemory = performance.measureUserAgentSpecificMemory;
const measuredSamples = [2000, 10192];

Object.defineProperty(performance, "measureUserAgentSpecificMemory", {
  configurable: true,
  value: async () => ({ bytes: measuredSamples.shift() ?? 10192 }),
});

const userAgentMeasuredMemory = await runUserCode({
  code: "var memoryProbe = function () { return [1]; };",
  functionName: "memoryProbe",
  judgeMode: "exact",
  testCases: [{ id: "1", input: "", expected: "[1]" }],
});

if (originalMeasureUserAgentSpecificMemory) {
  Object.defineProperty(performance, "measureUserAgentSpecificMemory", {
    configurable: true,
    value: originalMeasureUserAgentSpecificMemory,
  });
} else {
  Reflect.deleteProperty(performance, "measureUserAgentSpecificMemory");
}

assert(
  userAgentMeasuredMemory.memoryBytes >= 8192,
  "memory usage should prefer measureUserAgentSpecificMemory when available",
);

console.log("Smoke tests passed");
console.log(`Accepted runtime: ${accepted.durationMs.toFixed(3)} ms`);
console.log(`Wrong answer status: ${wrongAnswer.status}`);
console.log(`Runtime error status: ${runtimeError.status}`);
