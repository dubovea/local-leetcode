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

console.log("Smoke tests passed");
console.log(`Accepted runtime: ${accepted.durationMs.toFixed(3)} ms`);
console.log(`Wrong answer status: ${wrongAnswer.status}`);
console.log(`Runtime error status: ${runtimeError.status}`);
