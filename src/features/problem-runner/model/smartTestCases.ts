import type { Problem, TestCase } from "@/entities/problem/model/types";
import { parseInputAssignments } from "./runnerInput.js";

export const SMART_TEST_CASE_ID_PREFIX = "smart-test:";

const MAX_SMART_TEST_CASES = 8;

type ParsedInput = ReturnType<typeof parseInputAssignments>;
type SmartCandidate = {
  values: unknown[];
  expected: unknown;
};
type SmartPlan = {
  names: string[];
  candidates: SmartCandidate[];
};
type SmartPlanner = (problem: Problem, parsed: ParsedInput) => SmartPlan | null;

export function isSmartTestCaseId(caseId: string) {
  return caseId.startsWith(SMART_TEST_CASE_ID_PREFIX);
}

export function generateSmartTestCases(problem: Problem): TestCase[] {
  const parsedInput = parseFirstInput(problem);
  const planner = smartPlanners[problem.functionName];

  if (!parsedInput || !planner) {
    return [];
  }

  const plan = planner(problem, parsedInput);

  if (!plan) {
    return [];
  }

  const knownInputs = new Set(
    problem.testCases.map((testCase) => normalizeInputKey(testCase.input)),
  );
  const smartCases: TestCase[] = [];

  for (const candidate of plan.candidates) {
    if (candidate.values.length !== plan.names.length) {
      continue;
    }

    const input = buildInput(plan.names, candidate.values);
    const inputKey = normalizeInputKey(input);

    if (knownInputs.has(inputKey)) {
      continue;
    }

    knownInputs.add(inputKey);
    smartCases.push({
      id: `${SMART_TEST_CASE_ID_PREFIX}${problem.id}:${smartCases.length + 1}`,
      input,
      expected: stringifyLiteral(candidate.expected),
    });

    if (smartCases.length >= MAX_SMART_TEST_CASES) {
      break;
    }
  }

  return smartCases;
}

const smartPlanners: Record<string, SmartPlanner> = {
  addBinary: planAddBinary,
  canConstruct: planCanConstruct,
  canJump: planCanJump,
  canPlaceFlowers: planCanPlaceFlowers,
  climbStairs: planClimbStairs,
  containsDuplicate: planContainsDuplicate,
  firstUniqChar: planFirstUniqChar,
  gcdOfStrings: planGcdOfStrings,
  groupAnagrams: planGroupAnagrams,
  increasingTriplet: planIncreasingTriplet,
  intToRoman: planIntToRoman,
  isAnagram: planIsAnagram,
  isPalindrome: planIsPalindrome,
  isValid: planIsValid,
  kidsWithCandies: planKidsWithCandies,
  largestAltitude: planLargestAltitude,
  lengthOfLastWord: planLengthOfLastWord,
  lengthOfLongestSubstring: planLengthOfLongestSubstring,
  longestCommonPrefix: planLongestCommonPrefix,
  majorityElement: planMajorityElement,
  maxArea: planMaxArea,
  maxSubArray: planMaxSubArray,
  maxVowels: planMaxVowels,
  mergeAlternately: planMergeAlternately,
  missingNumber: planMissingNumber,
  mySqrt: planMySqrt,
  pivotIndex: planPivotIndex,
  plusOne: planPlusOne,
  productExceptSelf: planProductExceptSelf,
  reverse: planReverse,
  reverseVowels: planReverseVowels,
  romanToInt: planRomanToInt,
  searchInsert: planSearchInsert,
  singleNumber: planSingleNumber,
  sortedSquares: planSortedSquares,
  strStr: planStrStr,
  twoSum: planTwoSum,
};

function parseFirstInput(problem: Problem): ParsedInput | null {
  for (const testCase of problem.testCases) {
    try {
      const parsedInput = parseInputAssignments(testCase.input);

      if (parsedInput.names.length > 0) {
        return parsedInput;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function normalizeInputKey(input: string) {
  try {
    const parsedInput = parseInputAssignments(input);

    return buildInput(parsedInput.names, parsedInput.values);
  } catch {
    return input.trim().replace(/\r\n/g, "\n");
  }
}

function buildInput(names: string[], values: unknown[]) {
  return names.map((name, index) => `${name} = ${stringifyLiteral(values[index])}`).join("\n");
}

function stringifyLiteral(value: unknown) {
  const json = JSON.stringify(value);

  return typeof json === "undefined" ? String(value) : json;
}

function nameAt(parsed: ParsedInput, index: number, fallback: string) {
  return parsed.names[index] ?? fallback;
}

function oneName(parsed: ParsedInput, fallback: string) {
  return [nameAt(parsed, 0, fallback)];
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isNumber);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function titleIncludes(problem: Problem, value: string) {
  return problem.title.toLowerCase().includes(value);
}

function planOneNumber(
  parsed: ParsedInput,
  fallbackName: string,
  values: number[],
  solve: (value: number) => unknown,
): SmartPlan | null {
  if (!isNumber(parsed.values[0])) {
    return null;
  }

  return {
    names: oneName(parsed, fallbackName),
    candidates: values.map((value) => ({
      values: [value],
      expected: solve(value),
    })),
  };
}

function planOneString(
  parsed: ParsedInput,
  fallbackName: string,
  values: string[],
  solve: (value: string) => unknown,
): SmartPlan | null {
  if (!isString(parsed.values[0])) {
    return null;
  }

  return {
    names: oneName(parsed, fallbackName),
    candidates: values.map((value) => ({
      values: [value],
      expected: solve(value),
    })),
  };
}

function planOneNumberArray(
  parsed: ParsedInput,
  fallbackName: string,
  values: number[][],
  solve: (value: number[]) => unknown,
): SmartPlan | null {
  if (!isNumberArray(parsed.values[0])) {
    return null;
  }

  return {
    names: oneName(parsed, fallbackName),
    candidates: values.map((value) => ({
      values: [value],
      expected: solve(value),
    })),
  };
}

function planTwoSum(problem: Problem, parsed: ParsedInput): SmartPlan | null {
  if (!isNumberArray(parsed.values[0]) || !isNumber(parsed.values[1])) {
    return null;
  }

  const oneBased = problem.number === 167 || titleIncludes(problem, "two sum ii");
  const rawCases: Array<[number[], number]> = oneBased
    ? [
        [[2, 7, 11, 15], 9],
        [[2, 3, 4], 6],
        [[-1, 0], -1],
        [[0, 0, 3, 4], 0],
      ]
    : [
        [[2, 7, 11, 15], 9],
        [[3, 2, 4], 6],
        [[3, 3], 6],
        [[-1, -2, -3, -4, -5], -8],
        [[0, 4, 3, 0], 0],
      ];

  return {
    names: [nameAt(parsed, 0, oneBased ? "numbers" : "nums"), nameAt(parsed, 1, "target")],
    candidates: rawCases.flatMap(([nums, target]) => {
      const expected = solveTwoSum(nums, target, oneBased ? 1 : 0);

      return expected.length > 0 ? [{ values: [nums, target], expected }] : [];
    }),
  };
}

function solveTwoSum(nums: number[], target: number, offset: number) {
  for (let left = 0; left < nums.length; left += 1) {
    for (let right = left + 1; right < nums.length; right += 1) {
      if (nums[left] + nums[right] === target) {
        return [left + offset, right + offset];
      }
    }
  }

  return [];
}

function planLengthOfLongestSubstring(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  return planOneString(parsed, "s", ["", "bbbbb", "pwwkew", "abba", "dvdf", "anviaj"], (value) => {
    let best = 0;
    let left = 0;
    const lastSeen = new Map<string, number>();

    for (let right = 0; right < value.length; right += 1) {
      const char = value[right];
      const previousIndex = lastSeen.get(char);

      if (typeof previousIndex === "number" && previousIndex >= left) {
        left = previousIndex + 1;
      }

      lastSeen.set(char, right);
      best = Math.max(best, right - left + 1);
    }

    return best;
  });
}

function planReverse(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  return planOneNumber(parsed, "x", [123, -123, 120, 0, 1534236469], (value) => {
    const reversed =
      Math.sign(value) * Number(String(Math.abs(value)).split("").reverse().join(""));

    return reversed < -(2 ** 31) || reversed > 2 ** 31 - 1 ? 0 : reversed;
  });
}

function planIsPalindrome(problem: Problem, parsed: ParsedInput): SmartPlan | null {
  if (isNumber(parsed.values[0])) {
    if (problem.number !== 9 && !titleIncludes(problem, "palindrome number")) {
      return null;
    }

    return planOneNumber(parsed, "x", [121, -121, 10, 0, 12321], (value) => {
      const text = String(value);

      return text === text.split("").reverse().join("");
    });
  }

  if (isString(parsed.values[0])) {
    if (problem.number !== 125 && !titleIncludes(problem, "valid palindrome")) {
      return null;
    }

    return planOneString(
      parsed,
      "s",
      ["A man, a plan, a canal: Panama", "race a car", " ", "0P", "Madam, I'm Adam"],
      (value) => {
        const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, "");

        return normalized === normalized.split("").reverse().join("");
      },
    );
  }

  return null;
}

function planMaxArea(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  return planOneNumberArray(
    parsed,
    "height",
    [
      [1, 8, 6, 2, 5, 4, 8, 3, 7],
      [1, 1],
      [4, 3, 2, 1, 4],
      [1, 2, 1],
    ],
    (height) => {
      let best = 0;
      let left = 0;
      let right = height.length - 1;

      while (left < right) {
        best = Math.max(best, Math.min(height[left], height[right]) * (right - left));

        if (height[left] < height[right]) {
          left += 1;
        } else {
          right -= 1;
        }
      }

      return best;
    },
  );
}

function planIntToRoman(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  const entries: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  return planOneNumber(parsed, "num", [1, 3, 4, 9, 58, 1994, 3999], (value) => {
    let rest = value;
    let output = "";

    for (const [amount, roman] of entries) {
      while (rest >= amount) {
        output += roman;
        rest -= amount;
      }
    }

    return output;
  });
}

function planRomanToInt(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  const values: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };

  return planOneString(parsed, "s", ["III", "IV", "IX", "LVIII", "MCMXCIV", "CDXLIV"], (value) =>
    value.split("").reduce((total, char, index) => {
      const current = values[char] ?? 0;
      const next = values[value[index + 1]] ?? 0;

      return total + (current < next ? -current : current);
    }, 0),
  );
}

function planLongestCommonPrefix(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  if (!isStringArray(parsed.values[0])) {
    return null;
  }

  const cases = [
    ["flower", "flow", "flight"],
    ["dog", "racecar", "car"],
    [""],
    ["same", "same"],
    ["interspace", "internet", "internal"],
  ];

  return {
    names: oneName(parsed, "strs"),
    candidates: cases.map((strs) => ({
      values: [strs],
      expected: solveLongestCommonPrefix(strs),
    })),
  };
}

function solveLongestCommonPrefix(strs: string[]) {
  let prefix = strs[0] ?? "";

  for (const value of strs.slice(1)) {
    while (!value.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
    }
  }

  return prefix;
}

function planIsValid(problem: Problem, parsed: ParsedInput): SmartPlan | null {
  if (problem.number !== 20 && !titleIncludes(problem, "valid parentheses")) {
    return null;
  }

  const pairs: Record<string, string> = {
    ")": "(",
    "]": "[",
    "}": "{",
  };

  return planOneString(parsed, "s", ["()", "()[]{}", "(]", "([)]", "{[]}", "((("], (value) => {
    const stack: string[] = [];

    for (const char of value) {
      if (char === "(" || char === "[" || char === "{") {
        stack.push(char);
      } else if (stack.pop() !== pairs[char]) {
        return false;
      }
    }

    return stack.length === 0;
  });
}

function planSearchInsert(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  if (!isNumberArray(parsed.values[0]) || !isNumber(parsed.values[1])) {
    return null;
  }

  const cases: Array<[number[], number]> = [
    [[1, 3, 5, 6], 5],
    [[1, 3, 5, 6], 2],
    [[1, 3, 5, 6], 7],
    [[1, 3, 5, 6], 0],
    [[1], 0],
  ];

  return {
    names: [nameAt(parsed, 0, "nums"), nameAt(parsed, 1, "target")],
    candidates: cases.map(([nums, target]) => ({
      values: [nums, target],
      expected:
        nums.findIndex((num) => num >= target) === -1
          ? nums.length
          : nums.findIndex((num) => num >= target),
    })),
  };
}

function planGroupAnagrams(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  if (!isStringArray(parsed.values[0])) {
    return null;
  }

  const cases = [
    ["eat", "tea", "tan", "ate", "nat", "bat"],
    [""],
    ["a"],
    ["abc", "bca", "cab", "foo", "ofo"],
  ];

  return {
    names: oneName(parsed, "strs"),
    candidates: cases.map((strs) => ({
      values: [strs],
      expected: solveGroupAnagrams(strs),
    })),
  };
}

function solveGroupAnagrams(strs: string[]) {
  const groups = new Map<string, string[]>();

  for (const value of strs) {
    const key = value.split("").sort().join("");
    const group = groups.get(key);

    if (group) {
      group.push(value);
    } else {
      groups.set(key, [value]);
    }
  }

  return Array.from(groups.values());
}

function planMaxSubArray(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  return planOneNumberArray(
    parsed,
    "nums",
    [[-2, 1, -3, 4, -1, 2, 1, -5, 4], [1], [5, 4, -1, 7, 8], [-2, -1], [0, 0, 0]],
    (nums) => {
      let best = nums[0];
      let current = nums[0];

      for (const value of nums.slice(1)) {
        current = Math.max(value, current + value);
        best = Math.max(best, current);
      }

      return best;
    },
  );
}

function planCanJump(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  return planOneNumberArray(
    parsed,
    "nums",
    [[2, 3, 1, 1, 4], [3, 2, 1, 0, 4], [0], [2, 0, 0], [1, 0, 1, 0]],
    (nums) => {
      let reach = 0;

      for (let index = 0; index < nums.length; index += 1) {
        if (index > reach) {
          return false;
        }

        reach = Math.max(reach, index + nums[index]);
      }

      return true;
    },
  );
}

function planPlusOne(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  return planOneNumberArray(
    parsed,
    "digits",
    [[1, 2, 3], [4, 3, 2, 1], [9], [9, 9, 9], [0]],
    (digits) => {
      const output = [...digits];

      for (let index = output.length - 1; index >= 0; index -= 1) {
        if (output[index] < 9) {
          output[index] += 1;
          return output;
        }

        output[index] = 0;
      }

      return [1, ...output];
    },
  );
}

function planClimbStairs(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  return planOneNumber(parsed, "n", [1, 2, 3, 5, 10], (value) => {
    let previous = 1;
    let current = 1;

    for (let step = 2; step <= value; step += 1) {
      const next = previous + current;
      previous = current;
      current = next;
    }

    return current;
  });
}

function planSingleNumber(problem: Problem, parsed: ParsedInput): SmartPlan | null {
  if (problem.number !== 136 && titleIncludes(problem, "single number ii")) {
    return null;
  }

  return planOneNumberArray(
    parsed,
    "nums",
    [[2, 2, 1], [4, 1, 2, 1, 2], [1], [-1, -1, -2]],
    (nums) => nums.reduce((total, value) => total ^ value, 0),
  );
}

function planMajorityElement(problem: Problem, parsed: ParsedInput): SmartPlan | null {
  if (problem.number === 229 || titleIncludes(problem, "majority element ii")) {
    return null;
  }

  return planOneNumberArray(
    parsed,
    "nums",
    [[3, 2, 3], [2, 2, 1, 1, 1, 2, 2], [1], [-1, -1, -1, 2, 2]],
    (nums) => {
      const counts = new Map<number, number>();

      for (const value of nums) {
        const nextCount = (counts.get(value) ?? 0) + 1;

        if (nextCount > nums.length / 2) {
          return value;
        }

        counts.set(value, nextCount);
      }

      return nums[0];
    },
  );
}

function planContainsDuplicate(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  return planOneNumberArray(
    parsed,
    "nums",
    [[1, 2, 3, 1], [1, 2, 3, 4], [1, 1, 1, 3, 3, 4, 3, 2, 4, 2], [1], [-1, 0, 1, -1]],
    (nums) => new Set(nums).size !== nums.length,
  );
}

function planMissingNumber(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  return planOneNumberArray(
    parsed,
    "nums",
    [[3, 0, 1], [0, 1], [9, 6, 4, 2, 3, 5, 7, 0, 1], [0], [1]],
    (nums) => {
      const expectedTotal = (nums.length * (nums.length + 1)) / 2;

      return expectedTotal - nums.reduce((total, value) => total + value, 0);
    },
  );
}

function planSortedSquares(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  return planOneNumberArray(
    parsed,
    "nums",
    [[-4, -1, 0, 3, 10], [-7, -3, 2, 3, 11], [0], [-5, -3, -2, -1], [1, 2, 3]],
    (nums) => nums.map((value) => value * value).sort((left, right) => left - right),
  );
}

function planFirstUniqChar(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  return planOneString(
    parsed,
    "s",
    ["leetcode", "loveleetcode", "aabb", "z", "aadadaad"],
    (value) => {
      const counts = new Map<string, number>();

      for (const char of value) {
        counts.set(char, (counts.get(char) ?? 0) + 1);
      }

      for (let index = 0; index < value.length; index += 1) {
        if (counts.get(value[index]) === 1) {
          return index;
        }
      }

      return -1;
    },
  );
}

function planIsAnagram(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  if (!isString(parsed.values[0]) || !isString(parsed.values[1])) {
    return null;
  }

  const cases: Array<[string, string]> = [
    ["anagram", "nagaram"],
    ["rat", "car"],
    ["a", "ab"],
    ["a", "a"],
  ];

  return {
    names: [nameAt(parsed, 0, "s"), nameAt(parsed, 1, "t")],
    candidates: cases.map(([left, right]) => ({
      values: [left, right],
      expected: sortText(left) === sortText(right),
    })),
  };
}

function sortText(value: string) {
  return value.split("").sort().join("");
}

function planCanConstruct(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  if (!isString(parsed.values[0]) || !isString(parsed.values[1])) {
    return null;
  }

  const cases: Array<[string, string]> = [
    ["a", "b"],
    ["aa", "ab"],
    ["aa", "aab"],
    ["abc", "cbad"],
  ];

  return {
    names: [nameAt(parsed, 0, "ransomNote"), nameAt(parsed, 1, "magazine")],
    candidates: cases.map(([ransomNote, magazine]) => ({
      values: [ransomNote, magazine],
      expected: solveCanConstruct(ransomNote, magazine),
    })),
  };
}

function solveCanConstruct(ransomNote: string, magazine: string) {
  const counts = new Map<string, number>();

  for (const char of magazine) {
    counts.set(char, (counts.get(char) ?? 0) + 1);
  }

  for (const char of ransomNote) {
    const nextCount = (counts.get(char) ?? 0) - 1;

    if (nextCount < 0) {
      return false;
    }

    counts.set(char, nextCount);
  }

  return true;
}

function planMergeAlternately(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  if (!isString(parsed.values[0]) || !isString(parsed.values[1])) {
    return null;
  }

  const cases: Array<[string, string]> = [
    ["abc", "pqr"],
    ["ab", "pqrs"],
    ["abcd", "pq"],
    ["a", ""],
  ];

  return {
    names: [nameAt(parsed, 0, "word1"), nameAt(parsed, 1, "word2")],
    candidates: cases.map(([word1, word2]) => ({
      values: [word1, word2],
      expected: solveMergeAlternately(word1, word2),
    })),
  };
}

function solveMergeAlternately(word1: string, word2: string) {
  let output = "";
  const length = Math.max(word1.length, word2.length);

  for (let index = 0; index < length; index += 1) {
    output += word1[index] ?? "";
    output += word2[index] ?? "";
  }

  return output;
}

function planGcdOfStrings(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  if (!isString(parsed.values[0]) || !isString(parsed.values[1])) {
    return null;
  }

  const cases: Array<[string, string]> = [
    ["ABCABC", "ABC"],
    ["ABABAB", "ABAB"],
    ["LEET", "CODE"],
    ["AAAAAA", "AAA"],
  ];

  return {
    names: [nameAt(parsed, 0, "str1"), nameAt(parsed, 1, "str2")],
    candidates: cases.map(([str1, str2]) => ({
      values: [str1, str2],
      expected: solveGcdOfStrings(str1, str2),
    })),
  };
}

function solveGcdOfStrings(str1: string, str2: string) {
  if (str1 + str2 !== str2 + str1) {
    return "";
  }

  const gcdLength = gcd(str1.length, str2.length);

  return str1.slice(0, gcdLength);
}

function gcd(left: number, right: number): number {
  return right === 0 ? left : gcd(right, left % right);
}

function planKidsWithCandies(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  if (!isNumberArray(parsed.values[0]) || !isNumber(parsed.values[1])) {
    return null;
  }

  const cases: Array<[number[], number]> = [
    [[2, 3, 5, 1, 3], 3],
    [[4, 2, 1, 1, 2], 1],
    [[12, 1, 12], 10],
  ];

  return {
    names: [nameAt(parsed, 0, "candies"), nameAt(parsed, 1, "extraCandies")],
    candidates: cases.map(([candies, extraCandies]) => {
      const maxCandies = Math.max(...candies);

      return {
        values: [candies, extraCandies],
        expected: candies.map((value) => value + extraCandies >= maxCandies),
      };
    }),
  };
}

function planCanPlaceFlowers(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  if (!isNumberArray(parsed.values[0]) || !isNumber(parsed.values[1])) {
    return null;
  }

  const cases: Array<[number[], number]> = [
    [[1, 0, 0, 0, 1], 1],
    [[1, 0, 0, 0, 1], 2],
    [[0, 0, 1, 0, 0], 2],
    [[0], 1],
  ];

  return {
    names: [nameAt(parsed, 0, "flowerbed"), nameAt(parsed, 1, "n")],
    candidates: cases.map(([flowerbed, n]) => ({
      values: [flowerbed, n],
      expected: solveCanPlaceFlowers(flowerbed, n),
    })),
  };
}

function solveCanPlaceFlowers(flowerbed: number[], n: number) {
  const bed = [...flowerbed];
  let placed = 0;

  for (let index = 0; index < bed.length; index += 1) {
    if (bed[index] === 1) {
      continue;
    }

    const leftEmpty = index === 0 || bed[index - 1] === 0;
    const rightEmpty = index === bed.length - 1 || bed[index + 1] === 0;

    if (leftEmpty && rightEmpty) {
      bed[index] = 1;
      placed += 1;
    }
  }

  return placed >= n;
}

function planReverseVowels(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  return planOneString(parsed, "s", ["hello", "leetcode", "aA", "bcdfg", "IceCreAm"], (value) => {
    const chars = value.split("");
    let left = 0;
    let right = chars.length - 1;

    while (left < right) {
      while (left < right && !isVowel(chars[left])) {
        left += 1;
      }

      while (left < right && !isVowel(chars[right])) {
        right -= 1;
      }

      [chars[left], chars[right]] = [chars[right], chars[left]];
      left += 1;
      right -= 1;
    }

    return chars.join("");
  });
}

function isVowel(char: string) {
  return "aeiouAEIOU".includes(char);
}

function planProductExceptSelf(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  return planOneNumberArray(
    parsed,
    "nums",
    [
      [1, 2, 3, 4],
      [-1, 1, 0, -3, 3],
      [0, 0],
      [2, 3],
    ],
    (nums) =>
      nums.map((_, index) =>
        nums.reduce(
          (total, value, currentIndex) => (currentIndex === index ? total : total * value),
          1,
        ),
      ),
  );
}

function planIncreasingTriplet(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  return planOneNumberArray(
    parsed,
    "nums",
    [
      [1, 2, 3, 4, 5],
      [5, 4, 3, 2, 1],
      [2, 1, 5, 0, 4, 6],
      [20, 100, 10, 12, 5, 13],
    ],
    (nums) => {
      let first = Infinity;
      let second = Infinity;

      for (const value of nums) {
        if (value <= first) {
          first = value;
        } else if (value <= second) {
          second = value;
        } else {
          return true;
        }
      }

      return false;
    },
  );
}

function planPivotIndex(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  return planOneNumberArray(
    parsed,
    "nums",
    [
      [1, 7, 3, 6, 5, 6],
      [1, 2, 3],
      [2, 1, -1],
      [0, 0],
    ],
    (nums) => {
      const total = nums.reduce((sum, value) => sum + value, 0);
      let leftSum = 0;

      for (let index = 0; index < nums.length; index += 1) {
        if (leftSum === total - leftSum - nums[index]) {
          return index;
        }

        leftSum += nums[index];
      }

      return -1;
    },
  );
}

function planMaxVowels(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  if (!isString(parsed.values[0]) || !isNumber(parsed.values[1])) {
    return null;
  }

  const cases: Array<[string, number]> = [
    ["abciiidef", 3],
    ["aeiou", 2],
    ["leetcode", 3],
    ["rhythms", 4],
  ];

  return {
    names: [nameAt(parsed, 0, "s"), nameAt(parsed, 1, "k")],
    candidates: cases.map(([s, k]) => ({
      values: [s, k],
      expected: solveMaxVowels(s, k),
    })),
  };
}

function solveMaxVowels(value: string, k: number) {
  let current = 0;
  let best = 0;

  for (let index = 0; index < value.length; index += 1) {
    if (isVowel(value[index])) {
      current += 1;
    }

    if (index >= k && isVowel(value[index - k])) {
      current -= 1;
    }

    best = Math.max(best, current);
  }

  return best;
}

function planLargestAltitude(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  return planOneNumberArray(
    parsed,
    "gain",
    [[-5, 1, 5, 0, -7], [-4, -3, -2, -1, 4, 3, 2], [0], [1, 2, 3]],
    (gain) => {
      let altitude = 0;
      let best = 0;

      for (const value of gain) {
        altitude += value;
        best = Math.max(best, altitude);
      }

      return best;
    },
  );
}

function planStrStr(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  if (!isString(parsed.values[0]) || !isString(parsed.values[1])) {
    return null;
  }

  const cases: Array<[string, string]> = [
    ["sadbutsad", "sad"],
    ["leetcode", "leeto"],
    ["hello", "ll"],
    ["aaaaa", "bba"],
  ];

  return {
    names: [nameAt(parsed, 0, "haystack"), nameAt(parsed, 1, "needle")],
    candidates: cases.map(([haystack, needle]) => ({
      values: [haystack, needle],
      expected: haystack.indexOf(needle),
    })),
  };
}

function planLengthOfLastWord(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  return planOneString(
    parsed,
    "s",
    ["Hello World", "   fly me   to   the moon  ", "luffy is still joyboy", "a"],
    (value) => value.trim().split(/\s+/).at(-1)?.length ?? 0,
  );
}

function planAddBinary(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  if (!isString(parsed.values[0]) || !isString(parsed.values[1])) {
    return null;
  }

  const cases: Array<[string, string]> = [
    ["11", "1"],
    ["1010", "1011"],
    ["0", "0"],
    ["1111", "1111"],
  ];

  return {
    names: [nameAt(parsed, 0, "a"), nameAt(parsed, 1, "b")],
    candidates: cases.map(([left, right]) => ({
      values: [left, right],
      expected: (BigInt(`0b${left}`) + BigInt(`0b${right}`)).toString(2),
    })),
  };
}

function planMySqrt(_problem: Problem, parsed: ParsedInput): SmartPlan | null {
  return planOneNumber(parsed, "x", [0, 1, 4, 8, 2147395599], (value) =>
    Math.floor(Math.sqrt(value)),
  );
}
