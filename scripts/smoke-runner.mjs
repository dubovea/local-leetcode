import { runUserCode, parseInputAssignments } from "../src/features/problem-runner/model/runnerCore.js";

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

const runtimeError = await runUserCode({
  code: "var groupAnagrams = function () { throw new Error('boom'); };",
  functionName: "groupAnagrams",
  judgeMode: "unordered-array",
  testCases: [{ id: "1", input: 'strs = ["a"]', expected: '[["a"]]' }],
});

assert(runtimeError.status === "runtime-error", `expected runtime-error, got ${runtimeError.status}`);

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
