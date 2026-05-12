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
