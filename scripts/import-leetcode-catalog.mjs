import { writeFile } from "node:fs/promises";

const OUTPUT = new URL("../src/entities/problem/model/generatedLeetcodeCatalog.ts", import.meta.url);

const difficultyByLevel = new Map([
  [1, "Easy"],
  [2, "Medium"],
  [3, "Hard"],
]);

function titleFromSlug(slug) {
  return slug
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ")
    .replace(/\bAtoi\b/g, "atoi")
    .replace(/\bBst\b/g, "BST")
    .replace(/\bIi\b/g, "II")
    .replace(/\bIii\b/g, "III")
    .replace(/\bIv\b/g, "IV");
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function fromLeetcodeApi(data) {
  if (!Array.isArray(data.stat_status_pairs)) {
    return [];
  }

  return data.stat_status_pairs
    .map((item) => ({
      id: `lc-${item.stat.frontend_question_id}`,
      source: "leetcode",
      number: item.stat.frontend_question_id,
      title: item.stat.question__title,
      slug: item.stat.question__title_slug,
      difficulty: difficultyByLevel.get(item.difficulty?.level) ?? "Medium",
      paidOnly: Boolean(item.paid_only),
      url: `https://leetcode.com/problems/${item.stat.question__title_slug}/`,
    }))
    .filter((item) => Number.isFinite(item.number) && item.slug)
    .sort((a, b) => a.number - b.number);
}

function fromPublicApi(data) {
  const list = Array.isArray(data) ? data : data.problems;

  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .map((item) => {
      const number = Number(item.frontendQuestionId ?? item.questionFrontendId ?? item.number ?? item.id);
      const slug = item.titleSlug ?? item.slug ?? item.problem_slug;
      const difficulty = item.difficulty ?? "Medium";

      return {
        id: `lc-${number}`,
        source: "leetcode",
        number,
        title: item.title ?? titleFromSlug(slug ?? "problem"),
        slug,
        difficulty: difficulty === "easy" ? "Easy" : difficulty === "medium" ? "Medium" : difficulty === "hard" ? "Hard" : difficulty,
        paidOnly: Boolean(item.isPaidOnly ?? item.paidOnly ?? item.paid_only),
        url: `https://leetcode.com/problems/${slug}/`,
      };
    })
    .filter((item) => Number.isFinite(item.number) && item.slug)
    .sort((a, b) => a.number - b.number);
}

async function loadCatalog() {
  const sources = [
    async () => fromPublicApi(await fetchJson("https://leetcode-api-pied.vercel.app/problems")),
    async () => fromLeetcodeApi(await fetchJson("https://leetcode.com/api/problems/all/")),
  ];

  const errors = [];

  for (const source of sources) {
    try {
      const catalog = await source();

      if (catalog.length > 0) {
        return catalog;
      }
    } catch (error) {
      errors.push(error);
    }
  }

  throw new Error(errors.map((error) => error.message).join("\n"));
}

function renderTs(catalog) {
  return `import type { ProblemCatalogItem } from "./types";\n\nexport const generatedLeetcodeCatalog: ProblemCatalogItem[] = ${JSON.stringify(catalog, null, 2)};\n`;
}

const catalog = await loadCatalog();
await writeFile(OUTPUT, renderTs(catalog));
console.log(`Imported ${catalog.length} LeetCode problems into ${OUTPUT.pathname}`);
