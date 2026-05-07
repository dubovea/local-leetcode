# AGENTS.md

Project instructions for Codex.

This project is a LeetCode-like platform. Prioritize small, safe, verifiable changes over broad rewrites.

## Core Behavior

- Do not assume unclear requirements.
- For ambiguous tasks, ask a concise clarification before editing.
- If the task is clear, proceed without unnecessary questions.
- Prefer the simplest working solution.
- Do not add features, abstractions, configuration, or error handling that were not requested.
- Make surgical changes only. Every changed line must directly support the requested task.
- Match the existing project style even if a different style would be preferable.
- Do not refactor unrelated code.
- Do not rename files, functions, routes, or public APIs unless explicitly requested.
- Do not change formatting-only code outside the touched area.

## Before Editing

For non-trivial tasks, first inspect the relevant files and then state a brief plan:

1. What will be changed
2. What will not be changed
3. How the result will be verified

Do not start coding until the relevant existing implementation is understood.

## File Discovery Priority

When working on a feature or bug, inspect files in this order:

1. The file or component mentioned by the user
2. Nearby files in the same feature/module
3. Shared types, schemas, API clients, hooks, stores, or utilities used by that feature
4. Tests related to the touched code
5. Project config only if the task requires it

Avoid scanning the whole repository unless local context is insufficient.

## Change Rules

- Keep changes minimal.
- Prefer editing existing functions/components over introducing new layers.
- Do not introduce single-use abstractions.
- Do not move code between files unless it clearly reduces complexity for the requested task.
- Remove only imports, variables, and functions made unused by your own changes.
- If unrelated dead code is noticed, mention it in the final response instead of deleting it.
- Preserve existing naming conventions.
- Preserve existing UI/component patterns.

## TypeScript / React Rules

- Keep types explicit where the project already uses explicit types.
- Do not replace existing state management patterns unless requested.
- Do not introduce new dependencies unless the task cannot reasonably be solved without them.
- For UI changes, preserve existing component library usage and class naming style.
- Avoid unnecessary memoization. Use `useMemo`, `useCallback`, or `React.memo` only when there is a real render/performance reason.
- Do not silence TypeScript errors with `any`, `as unknown as`, or `// @ts-ignore` unless there is no safe alternative and the reason is documented.

## Backend Rules

- Preserve existing API contracts.
- Do not change request/response shapes unless explicitly requested.
- Keep validation close to existing validation patterns.
- Do not add broad catch-all error handling unless it changes user-facing behavior intentionally.
- Do not change database schema or migrations unless the task explicitly requires it.

## Algorithm / LeetCode Task Rules

When working on coding problems, submissions, test cases, or judge logic:

- Correctness is more important than cleverness.
- Explain time and memory complexity when implementing or reviewing an algorithm.
- Prefer readable solutions over micro-optimized solutions unless performance is the task.
- Include edge cases:
  - empty input
  - single element/input
  - duplicates
  - large input
  - invalid or boundary values when relevant
- Do not change problem statements, examples, or expected outputs unless explicitly requested.
- When optimizing a solution, preserve behavior first, then improve complexity.

## Verification

Before finishing, run the smallest relevant checks available.

Use the project’s existing commands. Prefer, in order:

1. Targeted tests for the changed module
2. Typecheck
3. Lint
4. Full test suite only when necessary

If commands are unknown, inspect `package.json`, backend config, or existing docs first.

If a check fails:
- Fix failures caused by your changes.
- Do not fix unrelated failures unless asked.
- Clearly report unrelated failures.

## Final Response Format

End every task with:

- Summary: what changed
- Verification: what was run and the result
- Notes: any important tradeoffs, assumptions, or unrelated issues noticed

Keep the final response concise.
Do not include large code dumps unless requested.