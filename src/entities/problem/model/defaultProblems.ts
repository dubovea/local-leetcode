import type { Problem } from "./types";

export const defaultProblems: Problem[] = [
  {
    id: "manual-group-anagrams",
    source: "manual",
    number: 49,
    title: "Group Anagrams",
    slug: "manual-group-anagrams",
    difficulty: "Medium",
    notesMarkdown: "",
    functionName: "groupAnagrams",
    judgeMode: "unordered-array",
    descriptionMarkdown: `# 49. Group Anagrams

Given an array of strings \`strs\`, group the anagrams together. You can return the answer in any order.

## Example 1

\`\`\`txt
Input: strs = ["eat","tea","tan","ate","nat","bat"]
Output: [["bat"],["nat","tan"],["ate","eat","tea"]]
\`\`\`

Explanation:

There is no string in \`strs\` that can be rearranged to form \`"bat"\`.
The strings \`"nat"\` and \`"tan"\` are anagrams as they can be rearranged to form each other.
The strings \`"ate"\`, \`"eat"\`, and \`"tea"\` are anagrams as they can be rearranged to form each other.

## Example 2

\`\`\`txt
Input: strs = [""]
Output: [[""]]
\`\`\`

## Example 3

\`\`\`txt
Input: strs = ["a"]
Output: [["a"]]
\`\`\`

## Constraints

- \`1 <= strs.length <= 10^4\`
- \`0 <= strs[i].length <= 100\`
- \`strs[i]\` consists of lowercase English letters.`,
    code: `/**
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
};`,
    testCases: [
      {
        id: "tc-group-anagrams-1",
        input: 'strs =\n["eat","tea","tan","ate","nat","bat"]',
        expected: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
      },
      { id: "tc-group-anagrams-2", input: 'strs =\n[""]', expected: '[[""]]' },
      { id: "tc-group-anagrams-3", input: 'strs =\n["a"]', expected: '[["a"]]' },
    ],
    submissions: [],
  },
];
