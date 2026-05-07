import { create } from "zustand";
import { defaultProblems } from "./defaultProblems";
import { generatedNeenzaProblems } from "./generatedNeenzaProblems";
import {
  clearProblemsDb,
  getAllProblemsFromDb,
  getProblemFromDb,
  getProblemIndexFromDb,
  hasProblemsInDb,
  putProblemsToDb,
  putProblemToDb,
  sortProblemIndex,
  toProblemListItem,
} from "./problemDb";
import type { Problem, ProblemListItem, Submission } from "./types";

const SELECTED_PROBLEM_KEY = "local-leetcode:v10:selected-problem-id";

function getSeedProblems() {
  return [...generatedNeenzaProblems, ...defaultProblems];
}

function readSelectedProblemId() {
  return localStorage.getItem(SELECTED_PROBLEM_KEY);
}

function saveSelectedProblemId(problemId: string) {
  localStorage.setItem(SELECTED_PROBLEM_KEY, problemId);
}

function mergeProblem(existing: Problem | undefined, incoming: Problem): Problem {
  if (!existing) {
    return incoming;
  }

  return {
    ...incoming,
    source: existing.source ?? incoming.source,
    code: existing.code || incoming.code,
    testCases: existing.testCases.length > 0 ? existing.testCases : incoming.testCases,
    submissions: existing.submissions.length > 0 ? existing.submissions : incoming.submissions,
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
  saveProblemCode: (problemId: string, code: string) => Promise<void>;
  addSubmission: (problemId: string, submission: Submission, code: string) => Promise<void>;
  addManualProblem: (problem: Problem) => Promise<void>;
  importProblems: (problems: Problem[]) => Promise<void>;
  resetProblems: () => Promise<void>;
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

      if (!hasStoredProblems) {
        await putProblemsToDb(getSeedProblems());
      }

      const index = await getProblemIndexFromDb();
      const selectedProblemId = readSelectedProblemId();
      const activeProblemId = index.some((item) => item.id === selectedProblemId)
        ? selectedProblemId
        : index[0]?.id ?? null;
      const activeProblem = activeProblemId ? await getProblemFromDb(activeProblemId) : null;

      if (activeProblemId) {
        saveSelectedProblemId(activeProblemId);
      }

      set({
        activeProblem: activeProblem ?? null,
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
    set({ activeProblem: problem, activeProblemId: problemId });
  },

  async updateActiveProblem(problem) {
    await putProblemToDb(problem);

    set((state) => ({
      activeProblem: state.activeProblemId === problem.id ? problem : state.activeProblem,
      problemIndex: sortProblemIndex([
        ...state.problemIndex.filter((item) => item.id !== problem.id),
        toProblemListItem(problem),
      ]),
    }));
  },

  async saveProblemCode(problemId, code) {
    const problem = await getProblemFromDb(problemId);

    if (!problem || problem.code === code) {
      return;
    }

    await putProblemToDb({ ...problem, code });
  },

  async addSubmission(problemId, submission, code) {
    const problem = await getProblemFromDb(problemId);

    if (!problem) {
      return;
    }

    const nextProblem = {
      ...problem,
      code,
      submissions: [...problem.submissions, submission],
    };

    await putProblemToDb(nextProblem);

    set((state) => ({
      activeProblem: state.activeProblemId === problemId ? nextProblem : state.activeProblem,
      problemIndex: sortProblemIndex([
        ...state.problemIndex.filter((item) => item.id !== problemId),
        toProblemListItem(nextProblem),
      ]),
    }));
  },

  async addManualProblem(problem) {
    await putProblemToDb(problem);
    saveSelectedProblemId(problem.id);

    set((state) => ({
      activeProblem: problem,
      activeProblemId: problem.id,
      problemIndex: sortProblemIndex([
        ...state.problemIndex.filter((item) => item.id !== problem.id),
        toProblemListItem(problem),
      ]),
    }));
  },

  async importProblems(problems) {
    const existingProblems = await getAllProblemsFromDb();
    const existingById = new Map(existingProblems.map((problem) => [problem.id, problem]));
    const mergedProblems = problems.map((problem) => mergeProblem(existingById.get(problem.id), problem));

    await putProblemsToDb(mergedProblems);

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

  async resetProblems() {
    await clearProblemsDb();
    await putProblemsToDb(getSeedProblems());

    const index = await getProblemIndexFromDb();
    const activeProblem = index[0] ? await getProblemFromDb(index[0].id) : null;

    if (activeProblem) {
      saveSelectedProblemId(activeProblem.id);
    }

    set({
      activeProblem: activeProblem ?? null,
      activeProblemId: activeProblem?.id ?? null,
      errorText: "",
      problemIndex: index,
    });
  },
}));
