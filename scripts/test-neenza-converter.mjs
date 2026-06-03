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
      "Given an array of strings strs, group the anagrams together. You can return the answer in any order.\nExample 1:\nExample 2:\nConstraints:",
    examples: [
      {
        example_num: 1,
        example_text:
          'Input: strs = ["eat","tea","tan","ate","nat","bat"]\nOutput: [["bat"],["nat","tan"],["ate","eat","tea"]]\nExplanation: grouped anagrams',
      },
      {
        example_num: 2,
        example_text: 'Input: strs = [""]\nOutput: [[""]]',
      },
    ],
    constraints: ["1 <= strs.length <= 10^4"],
    hints: ["Use a normalized key for every anagram group."],
    code_snippets: [
      {
        langSlug: "javascript",
        code: "/**\n * @param {string[]} strs\n * @return {string[][]}\n */\nvar groupAnagrams = function(strs) {\n    \n};",
      },
      {
        langSlug: "python3",
        code: "class Solution:\n    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:\n        pass",
      },
      {
        langSlug: "csharp",
        code: "public class Solution {\n    public IList<IList<string>> GroupAnagrams(string[] strs) {\n        \n    }\n}",
      },
      {
        langSlug: "cpp",
        code: "class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        \n    }\n};",
      },
      {
        langSlug: "golang",
        code: "func groupAnagrams(strs []string) [][]string {\n    return nil\n}",
      },
    ],
  },
  {
    title: "LRU Cache",
    problem_id: "146",
    frontend_id: "146",
    difficulty: "Medium",
    problem_slug: "lru-cache",
    topics: ["Hash Table", "Linked List", "Design"],
    description:
      "Design a data structure that follows the constraints of a Least Recently Used cache.",
    examples: [
      {
        example_num: 1,
        example_text: 'Input\n["LRUCache","put","get"]\n[[2],[1,1],[1]]\nOutput\n[null,null,1]',
      },
    ],
    constraints: ["1 <= capacity <= 3000"],
    code_snippets: {
      javascript: "var LRUCache = function(capacity) {\n    \n};",
    },
  },
];

const { problems, skippedCount } = convertNeenzaDataset(sample);
const [problem] = problems;
const designProblem = problems.find((item) => item.id === "lc-146");

assert(skippedCount === 0, "converter should not skip valid sample");
assert(problems.length === 2, "converter should return both problems");
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
  problem.descriptionMarkdown.includes("## Example 1:"),
  "description should include the first imported example",
);
assert(
  problem.descriptionMarkdown.includes("Explanation: grouped anagrams"),
  "description should preserve example explanations",
);
assert(
  problem.descriptionMarkdown.includes("## Example 2:"),
  "description should include all imported examples",
);
assert(
  !problem.descriptionMarkdown.includes("Example 1:\nExample 2:"),
  "description should remove empty example placeholders",
);
assert(
  problem.judgeMode === "unordered-array",
  "any-order tasks should use unordered-array judge internally",
);
assert(
  problem.codeByLanguage?.["python-pyodide"]?.includes("groupAnagrams"),
  "converter should preserve Python snippets",
);
assert(
  problem.codeByLanguage?.["csharp-wasm"]?.includes("GroupAnagrams"),
  "converter should preserve C# snippets",
);
assert(
  problem.codeByLanguage?.["cpp-wasm"]?.includes("groupAnagrams"),
  "converter should preserve C++ snippets",
);
assert(
  problem.codeByLanguage?.["go-wasm"]?.includes("groupAnagrams"),
  "converter should preserve Go snippets",
);
assert(
  problem.missingCodeLanguages?.includes("c-wasm"),
  "converter should mark missing supported snippets",
);
assert(problem.hints?.[0] === sample[0].hints[0], "converter should preserve hints");
assert(!problem.descriptionMarkdown.includes("## Hints"), "hints should stay out of markdown");
assert(designProblem, "converter should include design problem");
assert(designProblem.functionName === "LRUCache", "constructor name should be extracted");
assert(
  designProblem.testCases[0].input ===
    'operations = ["LRUCache","put","get"], arguments = [[2],[1,1],[1]]',
  "design inputs should be normalized into operations and arguments",
);
assert(
  designProblem.testCases[0].expected === "[null,null,1]",
  "design expected output should be parsed from example",
);

console.log("Neenza converter test passed");
