export type Difficulty = "Easy" | "Medium" | "Hard";

export type ProblemSource = "leetcode" | "manual";

export type JudgeMode = "exact" | "unordered-array";

export type TestCase = {
  id: string;
  input: string;
  expected: string;
};

export type RunStatus =
  | "idle"
  | "running"
  | "accepted"
  | "wrong-answer"
  | "runtime-error"
  | "timeout";

export type ConsoleLog = {
  type: "log" | "warn" | "error" | "table";
  text: string;
};

export type CaseRunResult = {
  id: string;
  name: string;
  passed: boolean;
  durationMs: number;
  memoryBytes?: number;
  inputText: string;
  outputText: string;
  expectedText: string;
  errorText?: string;
};

export type RunResult = {
  ok: boolean;
  status: RunStatus;
  durationMs: number;
  memoryBytes?: number;
  passedCount: number;
  totalCount: number;
  cases: CaseRunResult[];
  logs: ConsoleLog[];
  errorText?: string;
};

export type Submission = {
  id: string;
  submittedAt: string;
  status: Exclude<RunStatus, "idle" | "running">;
  runtimeMs: number;
  memoryBytes?: number;
  code: string;
  cases: CaseRunResult[];
  logs: ConsoleLog[];
  errorText?: string;
};

export type Problem = {
  id: string;
  source: ProblemSource;
  number: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  topics?: string[];
  descriptionMarkdown: string;
  notesMarkdown?: string;
  functionName: string;
  judgeMode: JudgeMode;
  code: string;
  testCases: TestCase[];
  submissions: Submission[];
};

export type ProblemListItem = {
  id: string;
  source: ProblemSource;
  number: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  topics?: string[];
  solved: boolean;
};

export type ProblemCatalogItem = {
  id: string;
  source: ProblemSource;
  number: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  topics?: string[];
  paidOnly?: boolean;
  url: string;
};

export type RunRequest = {
  code: string;
  functionName: string;
  judgeMode: JudgeMode;
  testCases: TestCase[];
};

export type ProblemsBackup = {
  version: 1;
  exportedAt: string;
  problems: Problem[];
};
