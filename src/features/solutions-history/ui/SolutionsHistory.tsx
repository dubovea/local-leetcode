import { RotateCcw, Trash2 } from "lucide-react";
import type { Submission } from "@/entities/problem/model/types";
import { formatDateTime, formatRuntime } from "@/shared/lib/date";
import { Button } from "@/shared/ui/button";
import { StatusText } from "@/shared/ui/StatusText";

export function SolutionsHistory({
  submissions,
  onRestore,
  onDelete,
}: {
  submissions: Submission[];
  onRestore: (submissionId: string) => void;
  onDelete: (submissionId: string) => void;
}) {
  if (submissions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-[var(--lc-border-strong)] bg-[var(--lc-panel-raised)] p-8 text-center text-sm text-[var(--lc-muted)]">
        Submit a solution to see successful and failed attempts here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {[...submissions].reverse().map((submission, index) => (
        <article
          key={submission.id}
          className="rounded-xl border border-[var(--lc-border)] bg-[var(--lc-panel-raised)]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-[var(--lc-border)] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <StatusText status={submission.status} />
              <span className="text-xs text-[var(--lc-muted)]">#{submissions.length - index}</span>
              <span className="truncate text-xs text-[var(--lc-muted)]">
                {formatDateTime(submission.submittedAt)}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs text-[var(--lc-muted)]">
              <span>{formatRuntime(submission.runtimeMs)}</span>
              <Button
                className="h-8 px-2 text-xs"
                title="Restore this code to editor"
                variant="ghost"
                onClick={() => onRestore(submission.id)}
              >
                <RotateCcw className="h-4 w-4" />
                Restore
              </Button>
              <Button
                aria-label="Delete this submission"
                className="h-8 px-2 text-xs"
                title="Delete this submission"
                variant="ghost"
                onClick={() => onDelete(submission.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {submission.errorText ? (
            <pre className="m-4 max-h-44 overflow-auto rounded-lg bg-[var(--lc-danger-soft)] p-3 text-xs text-[var(--lc-danger-text)]">
              {submission.errorText}
            </pre>
          ) : null}

          <div className="px-4 py-3">
            <div className="mb-2 flex items-center gap-3 text-xs text-[var(--lc-muted)]">
              <span className="font-semibold">Cases</span>
              <span>
                {submission.cases.filter((testCase) => testCase.passed).length}/
                {submission.cases.length} passed
              </span>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {submission.cases.map((testCase, caseIndex) => (
                <span
                  key={testCase.id}
                  className="inline-flex items-center gap-1 rounded-md bg-[var(--lc-code)] px-2 py-1 text-xs text-[var(--lc-text)]"
                >
                  <span
                    className={
                      testCase.passed
                        ? "h-2 w-2 rounded-full bg-[var(--lc-success)]"
                        : "h-2 w-2 rounded-full bg-[var(--lc-danger-strong)]"
                    }
                  />
                  Case {caseIndex + 1}
                </span>
              ))}
            </div>

            <div className="mb-2 text-xs font-semibold text-[var(--lc-muted)]">Code</div>
            <pre className="max-h-72 overflow-auto rounded-lg bg-[var(--lc-code)] p-4 text-xs leading-5 text-[var(--lc-text-strong)]">
              <code>{submission.code}</code>
            </pre>
          </div>
        </article>
      ))}
    </div>
  );
}
