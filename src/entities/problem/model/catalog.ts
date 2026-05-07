import { generatedLeetcodeCatalog } from "./generatedLeetcodeCatalog";
import { generatedNeenzaProblems } from "./generatedNeenzaProblems";
import { defaultProblems } from "./defaultProblems";
import type { Problem, ProblemCatalogItem } from "./types";

export function problemToCatalogItem(problem: Problem): ProblemCatalogItem {
  return {
    id: problem.id,
    source: problem.source ?? (problem.id.startsWith("custom-") ? "manual" : "leetcode"),
    number: problem.number,
    title: problem.title,
    slug: problem.slug,
    difficulty: problem.difficulty,
    topics: problem.topics ?? [],
    url: problem.source === "manual" ? "" : `https://leetcode.com/problems/${problem.slug}/`,
  };
}

const defaultCatalog = defaultProblems.map(problemToCatalogItem);
const neenzaCatalog = generatedNeenzaProblems.map(problemToCatalogItem);

export const problemCatalog: ProblemCatalogItem[] = Array.from(
  new Map(
    [...generatedLeetcodeCatalog, ...neenzaCatalog, ...defaultCatalog].map((item) => [
      item.id,
      item,
    ]),
  ).values(),
).sort((a, b) => a.number - b.number);

export function createProblemFromCatalog(item: ProblemCatalogItem): Problem {
  return {
    id: item.id,
    source: item.source,
    number: item.number,
    title: item.title,
    slug: item.slug,
    difficulty: item.difficulty,
    topics: item.topics ?? [],
    functionName: "solution",
    judgeMode: "exact",
    descriptionMarkdown:
      item.source === "manual"
        ? `# ${item.number}. ${item.title}\n\nWrite the problem description in Markdown.`
        : `# ${item.number}. ${item.title}\n\nPaste the Markdown description here.\n\nLeetCode link: ${item.url}`,
    code: `/**\n * Write your solution here.\n */\nvar solution = function (...args) {\n  console.log(args);\n};`,
    testCases: [{ id: `${item.id}-case-1`, input: "", expected: "undefined" }],
    submissions: [],
  };
}
