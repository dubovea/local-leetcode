import { create } from "zustand";
import { defaultProblems } from "./defaultProblems";
import { generatedNeenzaProblems } from "./generatedNeenzaProblems";
import { generatedPatternProblems } from "./generatedPatternProblems";
import {
  DEFAULT_CODE_LANGUAGE,
  codeLanguageOptions,
  getProblemCode,
  getStarterCodeForLanguage,
  isCodeLanguage,
} from "./codeLanguages";
import {
  clearProblemsDb,
  deleteProblemFromDb,
  getAllProblemsFromDb,
  getProblemFromDb,
  getProblemIndexFromDb,
  hasProblemsInDb,
  putProblemsToDb,
  putProblemToDb,
  sortProblemIndex,
  toProblemListItem,
} from "./problemDb";
import type {
  CodeLanguage,
  Problem,
  ProblemCodeByLanguage,
  ProblemListItem,
  ProblemsBackup,
  Submission,
} from "./types";

const LEGACY_SELECTED_PROBLEM_KEY = "local-leetcode:v12:selected-problem-id";
const SELECTED_PROBLEM_KEY = "medikcode:v1:selected-problem-id";
const PROBLEMS_INITIALIZED_KEY = "medikcode:v1:problems-initialized";
const PATTERN_SEED_KEY = "medikcode:v3:pattern-problems-seeded";

function getSeedProblems() {
  return [...generatedPatternProblems, ...generatedNeenzaProblems, ...defaultProblems];
}

function readSelectedProblemId() {
  return (
    localStorage.getItem(SELECTED_PROBLEM_KEY) ?? localStorage.getItem(LEGACY_SELECTED_PROBLEM_KEY)
  );
}

function saveSelectedProblemId(problemId: string) {
  localStorage.setItem(SELECTED_PROBLEM_KEY, problemId);
}

function clearSelectedProblemId() {
  localStorage.removeItem(SELECTED_PROBLEM_KEY);
}

function problemsInitialized() {
  return localStorage.getItem(PROBLEMS_INITIALIZED_KEY) === "true";
}

function markProblemsInitialized() {
  localStorage.setItem(PROBLEMS_INITIALIZED_KEY, "true");
}

function patternSeedImported() {
  return localStorage.getItem(PATTERN_SEED_KEY) === "true";
}

function markPatternSeedImported() {
  localStorage.setItem(PATTERN_SEED_KEY, "true");
}

function extractHintsFromMarkdown(markdown: string) {
  const match = /(?:^|\n)## Hints\s*\n+([\s\S]*?)(?=\n##\s+|\n#\s+|$)/i.exec(markdown);

  if (!match) {
    return [];
  }

  return match[1]
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
    .filter((line) => line && !line.startsWith("#"));
}

function normalizeProblem(problem: Problem): Problem {
  const activeLanguage = isCodeLanguage(problem.activeLanguage)
    ? problem.activeLanguage
    : DEFAULT_CODE_LANGUAGE;
  const codeByLanguage: ProblemCodeByLanguage = {
    [DEFAULT_CODE_LANGUAGE]:
      problem.code || getStarterCodeForLanguage(problem, DEFAULT_CODE_LANGUAGE),
  };

  for (const language of codeLanguageOptions) {
    const code = problem.codeByLanguage?.[language.value];

    if (typeof code === "string") {
      codeByLanguage[language.value] = code;
    }
  }

  if (!codeByLanguage[activeLanguage]) {
    codeByLanguage[activeLanguage] = getStarterCodeForLanguage(problem, activeLanguage);
  }

  const submissions = (problem.submissions ?? []).map((submission) => ({
    ...submission,
    language: isCodeLanguage(submission.language) ? submission.language : DEFAULT_CODE_LANGUAGE,
  }));
  const missingCodeLanguages = (problem.missingCodeLanguages ?? []).filter(isCodeLanguage);

  return {
    ...problem,
    activeLanguage,
    code: codeByLanguage[activeLanguage] ?? problem.code,
    codeByLanguage,
    hints:
      problem.hints && problem.hints.length > 0
        ? problem.hints
        : extractHintsFromMarkdown(problem.descriptionMarkdown),
    missingCodeLanguages,
    notesMarkdown: problem.notesMarkdown ?? "",
    submissions,
    testCases: problem.testCases ?? [],
    topics: problem.topics ?? [],
  };
}

function mergeProblem(existing: Problem | undefined, incoming: Problem): Problem {
  if (!existing) {
    return normalizeProblem(incoming);
  }

  return normalizeProblem({
    ...incoming,
    source: existing.source ?? incoming.source,
    code: existing.code || incoming.code,
    activeLanguage: existing.activeLanguage ?? incoming.activeLanguage,
    codeByLanguage: {
      ...(incoming.codeByLanguage ?? {}),
      ...(existing.codeByLanguage ?? {}),
    },
    hints: existing.hints && existing.hints.length > 0 ? existing.hints : (incoming.hints ?? []),
    missingCodeLanguages:
      existing.missingCodeLanguages && existing.missingCodeLanguages.length > 0
        ? existing.missingCodeLanguages
        : (incoming.missingCodeLanguages ?? []),
    notesMarkdown: existing.notesMarkdown ?? incoming.notesMarkdown ?? "",
    topics:
      existing.topics && existing.topics.length > 0 ? existing.topics : (incoming.topics ?? []),
    testCases: existing.testCases.length > 0 ? existing.testCases : incoming.testCases,
    submissions: existing.submissions.length > 0 ? existing.submissions : incoming.submissions,
  });
}

function buildBackup(problems: Problem[]): ProblemsBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    problems: problems.map(normalizeProblem),
  };
}

type ProblemStore = {
  activeProblem: Problem | null;
  activeProblemId: string | null;
  errorText: string;
  hydrated: boolean;
  problemIndex: ProblemListItem[];

  initialize: () => Promise<void>;
  selectProblem: (problemId: string) => Promise<void>;
  updateActiveProblem: (problem: Problem) => Promise<void>;
  saveProblemCode: (problemId: string, language: CodeLanguage, code: string) => Promise<void>;
  addSubmission: (problemId: string, submission: Submission, code: string) => Promise<void>;
  deleteSubmission: (problemId: string, submissionId: string) => Promise<void>;
  deleteProblem: (problemId: string) => Promise<void>;
  restoreSubmissionCode: (
    problemId: string,
    submissionId: string,
  ) => Promise<{ code: string; language: CodeLanguage } | null>;
  addManualProblem: (problem: Problem) => Promise<void>;
  importProblems: (problems: Problem[]) => Promise<void>;
  exportBackup: () => Promise<ProblemsBackup>;
  importBackup: (backup: ProblemsBackup | Problem[]) => Promise<void>;
  resetProblems: () => Promise<void>;
  resetSubmissions: () => Promise<void>;
};

export const useProblemStore = create<ProblemStore>((set, get) => ({
  activeProblem: null,
  activeProblemId: null,
  errorText: "",
  hydrated: false,
  problemIndex: [],

  async initialize() {
    try {
      const hasStoredProblems = await hasProblemsInDb();
      const initialized = problemsInitialized();

      if (!hasStoredProblems && !initialized) {
        await putProblemsToDb(getSeedProblems().map(normalizeProblem));
        markProblemsInitialized();
        markPatternSeedImported();
      } else if (hasStoredProblems) {
        markProblemsInitialized();
      } else {
        markPatternSeedImported();
      }

      let index = await getProblemIndexFromDb();

      if (hasStoredProblems && !patternSeedImported()) {
        const existingProblems = await getAllProblemsFromDb();
        const existingById = new Map(
          existingProblems.map((problem) => [problem.id, normalizeProblem(problem)]),
        );
        const patternProblems = generatedPatternProblems.map((problem) =>
          mergeProblem(existingById.get(problem.id), problem),
        );

        if (patternProblems.length > 0) {
          await putProblemsToDb(patternProblems);
          index = await getProblemIndexFromDb();
        }

        markPatternSeedImported();
      }

      const selectedProblemId = readSelectedProblemId();
      const activeProblemId = index.some((item) => item.id === selectedProblemId)
        ? selectedProblemId
        : (index[0]?.id ?? null);
      const activeProblem = activeProblemId ? await getProblemFromDb(activeProblemId) : null;

      if (activeProblemId) {
        saveSelectedProblemId(activeProblemId);
      }

      set({
        activeProblem: activeProblem ? normalizeProblem(activeProblem) : null,
        activeProblemId,
        errorText: "",
        hydrated: true,
        problemIndex: index,
      });
    } catch (error) {
      set({
        errorText: error instanceof Error ? error.message : "Failed to initialize problems",
        hydrated: true,
      });
    }
  },

  async selectProblem(problemId) {
    const problem = await getProblemFromDb(problemId);

    if (!problem) {
      return;
    }

    saveSelectedProblemId(problemId);
    set({ activeProblem: normalizeProblem(problem), activeProblemId: problemId });
  },

  async updateActiveProblem(problem) {
    const nextProblem = normalizeProblem(problem);

    await putProblemToDb(nextProblem);

    set((state) => ({
      activeProblem: state.activeProblemId === problem.id ? nextProblem : state.activeProblem,
      problemIndex: sortProblemIndex([
        ...state.problemIndex.filter((item) => item.id !== problem.id),
        toProblemListItem(nextProblem),
      ]),
    }));
  },

  async saveProblemCode(problemId, language, code) {
    const problem = await getProblemFromDb(problemId);

    if (!problem) {
      return;
    }

    const normalizedProblem = normalizeProblem(problem);
    const currentCode = getProblemCode(normalizedProblem, language);

    if (currentCode === code && normalizedProblem.activeLanguage === language) {
      return;
    }

    await putProblemToDb(
      normalizeProblem({
        ...normalizedProblem,
        activeLanguage: language,
        code,
        codeByLanguage: {
          ...(normalizedProblem.codeByLanguage ?? {}),
          [language]: code,
        },
      }),
    );
  },

  async addSubmission(problemId, submission, code) {
    const problem = await getProblemFromDb(problemId);

    if (!problem) {
      return;
    }

    const normalizedProblem = normalizeProblem(problem);
    const language = isCodeLanguage(submission.language)
      ? submission.language
      : (normalizedProblem.activeLanguage ?? DEFAULT_CODE_LANGUAGE);

    const nextProblem = normalizeProblem({
      ...normalizedProblem,
      activeLanguage: language,
      code,
      codeByLanguage: {
        ...(normalizedProblem.codeByLanguage ?? {}),
        [language]: code,
      },
      submissions: [...(problem.submissions ?? []), submission],
    });

    await putProblemToDb(nextProblem);

    set((state) => ({
      activeProblem: state.activeProblemId === problemId ? nextProblem : state.activeProblem,
      problemIndex: sortProblemIndex([
        ...state.problemIndex.filter((item) => item.id !== problemId),
        toProblemListItem(nextProblem),
      ]),
    }));
  },

  async deleteSubmission(problemId, submissionId) {
    const problem = await getProblemFromDb(problemId);

    if (!problem) {
      return;
    }

    const nextProblem = normalizeProblem({
      ...problem,
      submissions: (problem.submissions ?? []).filter(
        (submission) => submission.id !== submissionId,
      ),
    });

    await putProblemToDb(nextProblem);

    set((state) => ({
      activeProblem: state.activeProblemId === problemId ? nextProblem : state.activeProblem,
      problemIndex: sortProblemIndex([
        ...state.problemIndex.filter((item) => item.id !== problemId),
        toProblemListItem(nextProblem),
      ]),
    }));
  },

  async deleteProblem(problemId) {
    const currentIndex = get().problemIndex;
    const problemPosition = currentIndex.findIndex((item) => item.id === problemId);

    if (problemPosition === -1) {
      return;
    }

    await deleteProblemFromDb(problemId);
    markProblemsInitialized();

    const nextIndex = currentIndex.filter((item) => item.id !== problemId);
    const deletedActiveProblem = get().activeProblemId === problemId;

    if (!deletedActiveProblem) {
      set({ problemIndex: nextIndex });
      return;
    }

    const nextItem = nextIndex[Math.min(problemPosition, nextIndex.length - 1)] ?? null;
    const nextProblem = nextItem ? await getProblemFromDb(nextItem.id) : null;

    if (nextProblem) {
      saveSelectedProblemId(nextProblem.id);
    } else {
      clearSelectedProblemId();
      markPatternSeedImported();
    }

    set({
      activeProblem: nextProblem ? normalizeProblem(nextProblem) : null,
      activeProblemId: nextProblem?.id ?? null,
      problemIndex: nextIndex,
    });
  },

  async restoreSubmissionCode(problemId, submissionId) {
    const problem = await getProblemFromDb(problemId);
    const submission = problem
      ? (problem.submissions ?? []).find((item) => item.id === submissionId)
      : undefined;

    if (!problem || !submission) {
      return null;
    }

    const normalizedProblem = normalizeProblem(problem);
    const language = isCodeLanguage(submission.language)
      ? submission.language
      : DEFAULT_CODE_LANGUAGE;
    const nextProblem = normalizeProblem({
      ...normalizedProblem,
      activeLanguage: language,
      code: submission.code,
      codeByLanguage: {
        ...(normalizedProblem.codeByLanguage ?? {}),
        [language]: submission.code,
      },
    });

    await putProblemToDb(nextProblem);

    set((state) => ({
      activeProblem: state.activeProblemId === problemId ? nextProblem : state.activeProblem,
      problemIndex: sortProblemIndex([
        ...state.problemIndex.filter((item) => item.id !== problemId),
        toProblemListItem(nextProblem),
      ]),
    }));

    return { code: submission.code, language };
  },

  async addManualProblem(problem) {
    const nextProblem = normalizeProblem(problem);

    await putProblemToDb(nextProblem);
    markProblemsInitialized();
    saveSelectedProblemId(nextProblem.id);

    set((state) => ({
      activeProblem: nextProblem,
      activeProblemId: nextProblem.id,
      problemIndex: sortProblemIndex([
        ...state.problemIndex.filter((item) => item.id !== nextProblem.id),
        toProblemListItem(nextProblem),
      ]),
    }));
  },

  async importProblems(problems) {
    const existingProblems = await getAllProblemsFromDb();
    const existingById = new Map(
      existingProblems.map((problem) => [problem.id, normalizeProblem(problem)]),
    );
    const mergedProblems = problems.map((problem) =>
      mergeProblem(existingById.get(problem.id), problem),
    );

    await putProblemsToDb(mergedProblems);
    markProblemsInitialized();

    const index = await getProblemIndexFromDb();
    const firstImportedProblem = mergedProblems[0] ?? null;

    if (firstImportedProblem) {
      saveSelectedProblemId(firstImportedProblem.id);
    }

    set({
      activeProblem: firstImportedProblem,
      activeProblemId: firstImportedProblem?.id ?? get().activeProblemId,
      problemIndex: index,
    });
  },

  async exportBackup() {
    return buildBackup(await getAllProblemsFromDb());
  },

  async importBackup(backup) {
    const problems = Array.isArray(backup) ? backup : backup.problems;
    const normalizedProblems = problems.map(normalizeProblem);

    await clearProblemsDb();
    await putProblemsToDb(normalizedProblems);
    markProblemsInitialized();
    markPatternSeedImported();

    const index = await getProblemIndexFromDb();
    const activeProblem = index[0] ? await getProblemFromDb(index[0].id) : null;

    if (activeProblem) {
      saveSelectedProblemId(activeProblem.id);
    } else {
      clearSelectedProblemId();
    }

    set({
      activeProblem: activeProblem ? normalizeProblem(activeProblem) : null,
      activeProblemId: activeProblem?.id ?? null,
      errorText: "",
      problemIndex: index,
    });
  },

  async resetProblems() {
    await clearProblemsDb();
    clearSelectedProblemId();
    markProblemsInitialized();
    markPatternSeedImported();

    set({
      activeProblem: null,
      activeProblemId: null,
      errorText: "",
      problemIndex: [],
    });
  },

  async resetSubmissions() {
    const problems = (await getAllProblemsFromDb()).map((problem) =>
      normalizeProblem({
        ...problem,
        submissions: [],
      }),
    );

    await putProblemsToDb(problems);

    const activeProblemId = get().activeProblemId;
    const activeProblem = activeProblemId
      ? (problems.find((problem) => problem.id === activeProblemId) ?? null)
      : null;

    set({
      activeProblem,
      problemIndex: sortProblemIndex(problems.map(toProblemListItem)),
    });
  },
}));
