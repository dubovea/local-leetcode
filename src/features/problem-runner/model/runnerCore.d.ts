import type { RunRequest, RunResult } from "@/entities/problem/model/types";

export function parseInputAssignments(inputText: string): { names: string[]; values: unknown[] };
export function runUserCode(request: RunRequest): Promise<RunResult>;
