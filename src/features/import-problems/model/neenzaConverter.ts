import type { Difficulty, JudgeMode, Problem, TestCase } from "@/entities/problem/model/types";

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
const INPUT_LABEL_RE = /(?:^|\n)\s*Input\s*:?\s*/i;
const OUTPUT_LABEL_RE = /\n\s*Output\s*:?\s*/i;
const OUTPUT_END_RE = /\n\s*(Explanation|Constraints|Note|Follow[- ]?up)\s*:?/i;
const SUPPORTED_CODE_LANGUAGES = [
  "javascript",
  "python-pyodide",
  "c-wasm",
  "csharp-wasm",
  "cpp-wasm",
  "go-wasm",
] as const;
const SNIPPET_SLUGS_BY_LANGUAGE: Record<(typeof SUPPORTED_CODE_LANGUAGES)[number], string[]> = {
  javascript: ["javascript", "typescript"],
  "python-pyodide": ["python3", "python"],
  "c-wasm": ["c"],
  "csharp-wasm": ["csharp"],
  "cpp-wasm": ["cpp"],
  "go-wasm": ["golang"],
};

type NeenzaExample = {
  example_num?: number;
  example_text?: string;
  text?: string;
  images?: string[];
};

type NeenzaProblem = {
  title?: string;
  problem_id?: string | number;
  id?: string | number;
  frontend_id?: string | number;
  frontendId?: string | number;
  questionFrontendId?: string | number;
  difficulty?: string;
  problem_slug?: string;
  slug?: string;
  titleSlug?: string;
  topics?: string[];
  topicTags?: Array<string | { name?: string }>;
  description?: string;
  content?: string;
  examples?: NeenzaExample[] | string;
  constraints?: string[];
  follow_ups?: string[];
  hints?: string[];
  code_snippets?:
    | Record<string, string>
    | Array<{ langSlug?: string; lang?: string; language?: string; code?: string }>;
  solutions?: string;
};

export type ConvertNeenzaResult = {
  problems: Problem[];
  skippedCount: number;
};

function normalizeDataset(dataset: unknown): NeenzaProblem[] {
  if (Array.isArray(dataset)) {
    return dataset as NeenzaProblem[];
  }

  if (!dataset || typeof dataset !== "object") {
    return [];
  }

  const record = dataset as Record<string, unknown>;
  const candidates = [record.problems, record.data, record.items, record.questions];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as NeenzaProblem[];
    }
  }

  const values = Object.values(record);

  if (values.every((value) => value && typeof value === "object")) {
    return values as NeenzaProblem[];
  }

  return [];
}

function normalizeDifficulty(value: unknown): Difficulty {
  const text = String(value ?? "Medium")
    .trim()
    .toLowerCase();

  if (text === "easy") {
    return "Easy";
  }

  if (text === "hard") {
    return "Hard";
  }

  return "Medium";
}

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ")
    .replace(/\bAtoi\b/g, "atoi")
    .replace(/\bBst\b/g, "BST")
    .replace(/\bIi\b/g, "II")
    .replace(/\bIii\b/g, "III")
    .replace(/\bIv\b/g, "IV");
}

function normalizeSlug(problem: NeenzaProblem) {
  const slug = problem.problem_slug ?? problem.slug ?? problem.titleSlug;

  if (slug) {
    return String(slug);
  }

  return String(problem.title ?? "custom-problem")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeNumber(problem: NeenzaProblem) {
  const rawNumber =
    problem.frontend_id ??
    problem.frontendId ??
    problem.questionFrontendId ??
    problem.problem_id ??
    problem.id;
  const number = Number(rawNumber);

  return Number.isFinite(number) && number > 0 ? number : 0;
}

function normalizeTopics(problem: NeenzaProblem) {
  if (Array.isArray(problem.topics)) {
    return Array.from(
      new Set(
        problem.topics
          .filter((topic): topic is string => typeof topic === "string")
          .map((topic) => topic.trim())
          .filter(Boolean),
      ),
    );
  }

  if (Array.isArray(problem.topicTags)) {
    return Array.from(
      new Set(
        problem.topicTags
          .map((topic) => (typeof topic === "string" ? topic : topic.name))
          .filter((topic): topic is string => Boolean(topic))
          .map((topic) => topic.trim())
          .filter(Boolean),
      ),
    );
  }

  return [];
}

function normalizeSnippetEntries(problem: NeenzaProblem) {
  const snippets = problem.code_snippets;

  if (!snippets) {
    return new Map<string, string>();
  }

  if (Array.isArray(snippets)) {
    return new Map(
      snippets
        .map((snippet) => [snippet.langSlug ?? snippet.lang ?? snippet.language, snippet.code])
        .filter(
          (entry): entry is [string, string] => Boolean(entry[0]) && typeof entry[1] === "string",
        ),
    );
  }

  return new Map(Object.entries(snippets).filter(([, code]) => typeof code === "string"));
}

function getCodeSnippetsByLanguage(problem: NeenzaProblem) {
  const snippets = normalizeSnippetEntries(problem);
  const codeByLanguage: Problem["codeByLanguage"] = {};

  for (const language of SUPPORTED_CODE_LANGUAGES) {
    const snippet = SNIPPET_SLUGS_BY_LANGUAGE[language]
      .map((slug) => snippets.get(slug))
      .find((code): code is string => typeof code === "string" && Boolean(code.trim()));

    if (snippet) {
      codeByLanguage[language] = snippet;
    }
  }

  return codeByLanguage;
}

function extractFunctionName(code: string, title: string) {
  const patterns = [
    /var\s+([A-Za-z_$][\w$]*)\s*=\s*function/,
    /let\s+([A-Za-z_$][\w$]*)\s*=\s*function/,
    /const\s+([A-Za-z_$][\w$]*)\s*=\s*function/,
    /function\s+([A-Za-z_$][\w$]*)\s*\(/,
    /class\s+([A-Za-z_$][\w$]*)\s*/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(code);

    if (match?.[1]) {
      return match[1];
    }
  }

  const words = title
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/);
  const [first = "solution", ...rest] = words;
  return [first.toLowerCase(), ...rest.map((word) => word[0].toUpperCase() + word.slice(1))].join(
    "",
  );
}

function createStarterCode(problem: NeenzaProblem, title: string) {
  const snippet = (getCodeSnippetsByLanguage(problem).javascript ?? "").trim();

  if (snippet) {
    return snippet;
  }

  const functionName = extractFunctionName("", title);

  return `/**\n * Write your solution here.\n */\nvar ${functionName} = function (...args) {\n  console.log(args);\n};`;
}

function sectionBetween(text: string, startRe: RegExp, endRe?: RegExp) {
  const startMatch = startRe.exec(text);

  if (!startMatch) {
    return "";
  }

  const startIndex = startMatch.index + startMatch[0].length;
  const rest = text.slice(startIndex);
  const endMatch = endRe?.exec(rest);

  if (!endMatch) {
    return rest.trim();
  }

  return rest.slice(0, endMatch.index).trim();
}

function cleanInput(input: string) {
  return input
    .replace(/^\s*Input\s*:?\s*/i, "")
    .replace(/,\s*Output\s*:.*/is, "")
    .trim();
}

function cleanExpected(expected: string) {
  return expected
    .replace(/^\s*Output\s*:?\s*/i, "")
    .replace(OUTPUT_END_RE, "")
    .trim();
}

function parseExampleText(exampleText: string, id: string): TestCase | null {
  const input = cleanInput(sectionBetween(exampleText, INPUT_LABEL_RE, OUTPUT_LABEL_RE));
  const expected = cleanExpected(sectionBetween(exampleText, OUTPUT_LABEL_RE, OUTPUT_END_RE));

  if (!input || !expected) {
    return null;
  }

  return { id, input: normalizeTestInput(input), expected };
}

function normalizeTestInput(input: string) {
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length >= 2 && lines[0].startsWith("[") && lines[1].startsWith("[")) {
    return `operations = ${lines[0]}, arguments = ${lines[1]}`;
  }

  return input;
}

function normalizeExampleList(examples: NeenzaProblem["examples"]) {
  if (typeof examples === "string") {
    return [{ example_num: 1, example_text: examples }];
  }

  if (Array.isArray(examples)) {
    return examples;
  }

  if (examples && typeof examples === "object") {
    return [examples as NeenzaExample];
  }

  return [];
}

function normalizeExamples(problem: NeenzaProblem, problemId: string) {
  return normalizeExampleList(problem.examples)
    .map((example, index) =>
      parseExampleText(
        example.example_text ?? example.text ?? "",
        `${problemId}-case-${index + 1}`,
      ),
    )
    .filter((testCase): testCase is TestCase => Boolean(testCase));
}

function normalizeExampleMarkdownText(text: string) {
  return text.replace(/\r\n/g, "\n").trim();
}

function getExampleMarkdownEntries(problem: NeenzaProblem) {
  return normalizeExampleList(problem.examples)
    .map((example, index) => ({
      number: example.example_num ?? index + 1,
      text: normalizeExampleMarkdownText(example.example_text ?? example.text ?? ""),
    }))
    .filter((example) => example.text);
}

function stripExampleBlocks(description: string) {
  return description.replace(
    /\n?\s*Example\s+\d+\s*:?\s*[\s\S]*?(?=\n\s*(?:Example\s+\d+\s*:|Constraints\s*:|Follow[- ]?up\s*:|Note\s*:)|$)/gi,
    "\n",
  );
}

function stripConstraintsBlock(description: string) {
  return description.replace(
    /\n?\s*Constraints\s*:?\s*[\s\S]*?(?=\n\s*(?:Example\s+\d+\s*:|Follow[- ]?up\s*:|Note\s*:)|$)/gi,
    "\n",
  );
}

function cleanDescriptionText(
  description: string,
  options: { stripExamples: boolean; stripConstraints: boolean },
) {
  let cleanDescription = description.replace(/\r\n/g, "\n").trim();

  if (options.stripExamples) {
    cleanDescription = stripExampleBlocks(cleanDescription);
  } else {
    cleanDescription = cleanDescription.replace(/^\s*Example\s+\d+\s*:?\s*$/gim, "");
  }

  if (options.stripConstraints) {
    cleanDescription = stripConstraintsBlock(cleanDescription);
  } else {
    cleanDescription = cleanDescription.replace(/^\s*Constraints\s*:?\s*$/gim, "");
  }

  return cleanDescription.replace(/\n{3,}/g, "\n\n").trim();
}

function buildExamplesMarkdown(problem: NeenzaProblem) {
  const examples = getExampleMarkdownEntries(problem);

  return examples.map((example) => {
    const text = example.text.replace(/```/g, "'''");

    return `## Example ${example.number}:\n\n\`\`\`text\n${text}\n\`\`\``;
  });
}

function buildDescriptionMarkdown(problem: NeenzaProblem, title: string, number: number) {
  const parts = [`# ${number ? `${number}. ` : ""}${title}`];
  const examplesMarkdown = buildExamplesMarkdown(problem);
  const constraints = Array.isArray(problem.constraints) ? problem.constraints : [];
  const hasConstraints = constraints.length > 0;
  const rawDescription = String(problem.description ?? problem.content ?? "");
  const description = cleanDescriptionText(rawDescription, {
    stripExamples: examplesMarkdown.length > 0,
    stripConstraints: hasConstraints,
  });

  if (description) {
    parts.push(description);
  }

  parts.push(...examplesMarkdown);

  if (hasConstraints) {
    parts.push(
      `## Constraints\n\n${constraints.map((constraint) => `- ${constraint}`).join("\n")}`,
    );
  }

  return parts.filter(Boolean).join("\n\n");
}

function judgeModeFrom(problem: NeenzaProblem): JudgeMode {
  const haystack = `${problem.title ?? ""}\n${problem.description ?? ""}`.toLowerCase();

  if (haystack.includes("any order") || haystack.includes("in any order")) {
    return "unordered-array";
  }

  return "exact";
}

function problemFromNeenza(problem: NeenzaProblem): Problem | null {
  const number = normalizeNumber(problem);
  const slug = normalizeSlug(problem);
  const title = String(problem.title ?? titleFromSlug(slug)).trim();

  if (!number || !title || !slug) {
    return null;
  }

  const id = `lc-${number}`;
  const code = createStarterCode(problem, title);
  const codeByLanguage = getCodeSnippetsByLanguage(problem);
  if (!codeByLanguage.javascript) {
    codeByLanguage.javascript = code;
  }
  const missingCodeLanguages = SUPPORTED_CODE_LANGUAGES.filter(
    (language) => !codeByLanguage[language],
  );
  const topics = normalizeTopics(problem);
  const hints = Array.isArray(problem.hints)
    ? problem.hints.filter(
        (hint): hint is string => typeof hint === "string" && Boolean(hint.trim()),
      )
    : [];

  const testCases = normalizeExamples(problem, id);

  return {
    id,
    source: "leetcode",
    number,
    title,
    slug,
    difficulty: DIFFICULTIES.includes(problem.difficulty as Difficulty)
      ? (problem.difficulty as Difficulty)
      : normalizeDifficulty(problem.difficulty),
    topics,
    descriptionMarkdown: buildDescriptionMarkdown(problem, title, number),
    notesMarkdown: "",
    functionName: extractFunctionName(code, title),
    judgeMode: judgeModeFrom(problem),
    code,
    activeLanguage: "javascript",
    codeByLanguage,
    missingCodeLanguages,
    hints,
    testCases:
      testCases.length > 0 ? testCases : [{ id: `${id}-case-1`, input: "", expected: "undefined" }],
    submissions: [],
  };
}

export function convertNeenzaDataset(dataset: unknown): ConvertNeenzaResult {
  const sourceProblems = normalizeDataset(dataset);
  const problemsById = new Map<string, Problem>();
  let skippedCount = 0;

  for (const sourceProblem of sourceProblems) {
    const problem = problemFromNeenza(sourceProblem);

    if (!problem) {
      skippedCount += 1;
      continue;
    }

    problemsById.set(problem.id, problem);
  }

  return {
    problems: Array.from(problemsById.values()).sort((a, b) => a.number - b.number),
    skippedCount,
  };
}
