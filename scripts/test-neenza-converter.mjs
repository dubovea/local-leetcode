import { convertNeenzaDataset } from "./lib/neenza-converter.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const sample = [
  {
    title: "Group Anagrams",
    problem_id: "49",
    frontend_id: "49",
    difficulty: "Medium",
    problem_slug: "group-anagrams",
    topics: ["Array", "Hash Table", "String", "Sorting"],
    description:
      "Given an array of strings strs, group the anagrams together. You can return the answer in any order.",
    examples: [
      {
        example_num: 1,
        example_text:
          'Input: strs = ["eat","tea","tan","ate","nat","bat"]\nOutput: [["bat"],["nat","tan"],["ate","eat","tea"]]\nExplanation: grouped anagrams',
      },
    ],
    constraints: ["1 <= strs.length <= 10^4"],
    code_snippets: {
      javascript:
        "/**\n * @param {string[]} strs\n * @return {string[][]}\n */\nvar groupAnagrams = function(strs) {\n    \n};",
    },
  },
];

const { problems, skippedCount } = convertNeenzaDataset(sample);
const [problem] = problems;

assert(skippedCount === 0, "converter should not skip valid sample");
assert(problems.length === 1, "converter should return one problem");
assert(problem.id === "lc-49", "problem id should be based on frontend_id");
assert(
  problem.functionName === "groupAnagrams",
  "function name should be extracted from JS snippet",
);
assert(
  problem.topics.join(",") === "Array,Hash Table,String,Sorting",
  "topics should be preserved from LeetCode source",
);
assert(
  problem.testCases[0].input === 'strs = ["eat","tea","tan","ate","nat","bat"]',
  "input should be parsed from example",
);
assert(
  problem.testCases[0].expected === '[["bat"],["nat","tan"],["ate","eat","tea"]]',
  "expected output should be parsed from example",
);
assert(
  problem.judgeMode === "unordered-array",
  "any-order tasks should use unordered-array judge internally",
);

console.log("Neenza converter test passed");
