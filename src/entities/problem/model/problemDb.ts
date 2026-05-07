import type { Problem, ProblemListItem } from "./types";

const DB_NAME = "local-leetcode";
const DB_VERSION = 1;
const PROBLEMS_STORE = "problems";

type ProblemDb = IDBDatabase;

let dbPromise: Promise<ProblemDb> | null = null;

function openProblemDb() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(PROBLEMS_STORE)) {
        db.createObjectStore(PROBLEMS_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });

  return dbPromise;
}

async function getStore(mode: IDBTransactionMode) {
  const db = await openProblemDb();
  const tx = db.transaction(PROBLEMS_STORE, mode);

  return tx.objectStore(PROBLEMS_STORE);
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function problemToListItem(problem: Problem): ProblemListItem {
  return {
    id: problem.id,
    source: problem.source,
    number: problem.number,
    title: problem.title,
    slug: problem.slug,
    difficulty: problem.difficulty,
    solved: (problem.submissions ?? []).some((submission) => submission.status === "accepted"),
  };
}

export function sortProblemIndex(items: ProblemListItem[]) {
  return [...items].sort((a, b) => {
    if (a.source !== b.source) {
      return a.source === "leetcode" ? -1 : 1;
    }

    return a.number - b.number;
  });
}

export async function getAllProblemsFromDb() {
  const store = await getStore("readonly");
  const problems = await requestToPromise<Problem[]>(store.getAll());

  return problems;
}

export async function getProblemIndexFromDb() {
  const problems = await getAllProblemsFromDb();

  return sortProblemIndex(problems.map(problemToListItem));
}

export async function getProblemFromDb(id: string) {
  const store = await getStore("readonly");
  const problem = await requestToPromise<Problem | undefined>(store.get(id));

  return problem;
}

export async function putProblemToDb(problem: Problem) {
  const store = await getStore("readwrite");
  await requestToPromise(store.put(problem));

  return problemToListItem(problem);
}

export async function putProblemsToDb(problems: Problem[]) {
  const db = await openProblemDb();
  const tx = db.transaction(PROBLEMS_STORE, "readwrite");
  const store = tx.objectStore(PROBLEMS_STORE);

  for (const problem of problems) {
    store.put(problem);
  }

  await transactionDone(tx);

  return sortProblemIndex(problems.map(problemToListItem));
}

export async function clearProblemsDb() {
  const store = await getStore("readwrite");
  await requestToPromise(store.clear());
}

export async function hasProblemsInDb() {
  const store = await getStore("readonly");
  const count = await requestToPromise<number>(store.count());

  return count > 0;
}

export function toProblemListItem(problem: Problem) {
  return problemToListItem(problem);
}
