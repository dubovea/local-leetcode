const INPUT_LABEL_RE = /Input\s*:/i;
const OUTPUT_LABEL_RE = /Output\s*:/i;
const OUTPUT_END_RE = /\n\s*(Explanation|Constraints|Note|Follow[- ]?up)\s*:/i;

function normalizeDataset(dataset) {
  if (Array.isArray(dataset)) return dataset;
  if (!dataset || typeof dataset !== "object") return [];

  for (const key of ["problems", "data", "items", "questions"]) {
    if (Array.isArray(dataset[key])) return dataset[key];
  }

  const values = Object.values(dataset);
  return values.every((value) => value && typeof value === "object") ? values : [];
}

function normalizeDifficulty(value) {
  const text = String(value ?? "Medium").trim().toLowerCase();
  if (text === "easy") return "Easy";
  if (text === "hard") return "Hard";
  return "Medium";
}

function titleFromSlug(slug) {
  return String(slug)
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

function normalizeSlug(problem) {
  if (problem.problem_slug || problem.slug || problem.titleSlug) {
    return String(problem.problem_slug ?? problem.slug ?? problem.titleSlug);
  }

  return String(problem.title ?? "custom-problem")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeNumber(problem) {
  const rawNumber = problem.frontend_id ?? problem.frontendId ?? problem.questionFrontendId ?? problem.problem_id ?? problem.id;
  const number = Number(rawNumber);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function normalizeTopics(problem) {
  if (Array.isArray(problem.topics)) return problem.topics.filter((topic) => typeof topic === "string");

  if (Array.isArray(problem.topicTags)) {
    return problem.topicTags
      .map((topic) => (typeof topic === "string" ? topic : topic?.name))
      .filter(Boolean);
  }

  return [];
}

function getCodeSnippet(problem) {
  const snippets = problem.code_snippets;
  if (!snippets) return "";

  if (Array.isArray(snippets)) {
    return snippets.find((snippet) => snippet.langSlug === "javascript")?.code ?? snippets.find((snippet) => snippet.langSlug === "typescript")?.code ?? "";
  }

  return snippets.javascript ?? snippets.typescript ?? "";
}

function extractFunctionName(code, title) {
  const patterns = [
    /var\s+([A-Za-z_$][\w$]*)\s*=\s*function/,
    /let\s+([A-Za-z_$][\w$]*)\s*=\s*function/,
    /const\s+([A-Za-z_$][\w$]*)\s*=\s*function/,
    /function\s+([A-Za-z_$][\w$]*)\s*\(/,
    /class\s+([A-Za-z_$][\w$]*)\s*/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(code);
    if (match?.[1]) return match[1];
  }

  const words = String(title).replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/);
  const [first = "solution", ...rest] = words;
  return [first.toLowerCase(), ...rest.map((word) => word[0].toUpperCase() + word.slice(1))].join("");
}

function createStarterCode(problem, title) {
  const snippet = getCodeSnippet(problem).trim();
  if (snippet) return snippet;

  const functionName = extractFunctionName("", title);
  return `/**\n * Write your solution here.\n */\nvar ${functionName} = function (...args) {\n  console.log(args);\n};`;
}

function sectionBetween(text, startRe, endRe) {
  const startMatch = startRe.exec(text);
  if (!startMatch) return "";

  const startIndex = startMatch.index + startMatch[0].length;
  const rest = text.slice(startIndex);
  const endMatch = endRe?.exec(rest);
  return (endMatch ? rest.slice(0, endMatch.index) : rest).trim();
}

function cleanInput(input) {
  return input.replace(/^\s*Input\s*:?\s*/i, "").replace(/,\s*Output\s*:.*/is, "").trim();
}

function cleanExpected(expected) {
  return expected.replace(/^\s*Output\s*:?\s*/i, "").replace(OUTPUT_END_RE, "").trim();
}

function parseExampleText(exampleText, id) {
  const input = cleanInput(sectionBetween(exampleText, INPUT_LABEL_RE, OUTPUT_LABEL_RE));
  const expected = cleanExpected(sectionBetween(exampleText, OUTPUT_LABEL_RE, OUTPUT_END_RE));

  if (!input || !expected) return null;
  return { id, input, expected };
}

function normalizeExamples(problem, problemId) {
  if (typeof problem.examples === "string") {
    const testCase = parseExampleText(problem.examples, `${problemId}-case-1`);
    return testCase ? [testCase] : [];
  }

  if (!Array.isArray(problem.examples)) return [];

  return problem.examples
    .map((example, index) => parseExampleText(example.example_text ?? example.text ?? "", `${problemId}-case-${index + 1}`))
    .filter(Boolean);
}

function buildDescriptionMarkdown(problem, title, number) {
  const parts = [`# ${number ? `${number}. ` : ""}${title}`];
  const topics = normalizeTopics(problem);

  if (problem.description) parts.push(String(problem.description).trim());
  else if (problem.content) parts.push(String(problem.content).trim());
  else parts.push("Paste the problem description here.");

  if (Array.isArray(problem.constraints) && problem.constraints.length > 0) {
    parts.push(`## Constraints\n\n${problem.constraints.map((constraint) => `- ${constraint}`).join("\n")}`);
  }

  if (Array.isArray(problem.hints) && problem.hints.length > 0) {
    parts.push(`## Hints\n\n${problem.hints.map((hint) => `- ${hint}`).join("\n")}`);
  }

  if (topics.length > 0) {
    parts.push(`## Topics\n\n${topics.map((topic) => `- ${topic}`).join("\n")}`);
  }

  return parts.filter(Boolean).join("\n\n");
}

function judgeModeFrom(problem) {
  const haystack = `${problem.title ?? ""}\n${problem.description ?? ""}`.toLowerCase();
  return haystack.includes("any order") || haystack.includes("in any order") ? "unordered-array" : "exact";
}

function problemFromNeenza(problem) {
  const number = normalizeNumber(problem);
  const slug = normalizeSlug(problem);
  const title = String(problem.title ?? titleFromSlug(slug)).trim();

  if (!number || !title || !slug) return null;

  const id = `lc-${number}`;
  const code = createStarterCode(problem, title);

  const testCases = normalizeExamples(problem, id);

  return {
    id,
    source: "leetcode",
    number,
    title,
    slug,
    difficulty: normalizeDifficulty(problem.difficulty),
    descriptionMarkdown: buildDescriptionMarkdown(problem, title, number),
    notesMarkdown: "",
    functionName: extractFunctionName(code, title),
    judgeMode: judgeModeFrom(problem),
    code,
    testCases: testCases.length > 0 ? testCases : [{ id: `${id}-case-1`, input: "", expected: "undefined" }],
    submissions: [],
  };
}

export function convertNeenzaDataset(dataset) {
  const sourceProblems = normalizeDataset(dataset);
  const problemsById = new Map();
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
