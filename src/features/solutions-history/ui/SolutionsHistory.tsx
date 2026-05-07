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
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-[#3a3a3a] bg-[#202020] p-8 text-center text-sm text-[#9f9f9f]">
        Submit a solution to see successful and failed attempts here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {[...submissions].reverse().map((submission, index) => (
        <article key={submission.id} className="rounded-xl border border-[#323232] bg-[#202020]">
          <header className="flex items-center justify-between gap-3 border-b border-[#323232] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <StatusText status={submission.status} />
              <span className="text-xs text-[#8f8f8f]">#{submissions.length - index}</span>
              <span className="truncate text-xs text-[#9f9f9f]">{formatDateTime(submission.submittedAt)}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs text-[#9f9f9f]">
              <span>{formatRuntime(submission.runtimeMs)}</span>
              <Button className="h-8 px-2 text-xs" title="Restore this code to editor" variant="ghost" onClick={() => onRestore(submission.id)}>
                <RotateCcw className="h-4 w-4" />
                Restore
              </Button>
              <Button className="h-8 px-2 text-xs" title="Delete this submission" variant="ghost" onClick={() => onDelete(submission.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {submission.errorText ? (
            <pre className="m-4 max-h-44 overflow-auto rounded-lg bg-[#3a2222] p-3 text-xs text-[#ffb4b4]">{submission.errorText}</pre>
          ) : null}

          <div className="px-4 py-3">
            <div className="mb-2 flex items-center gap-3 text-xs text-[#a8a8a8]">
              <span className="font-semibold">Cases</span>
              <span>
                {submission.cases.filter((testCase) => testCase.passed).length}/{submission.cases.length} passed
              </span>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {submission.cases.map((testCase, caseIndex) => (
                <span key={testCase.id} className="rounded-md bg-[#171717] px-2 py-1 text-xs text-[#cfcfcf]">
                  <span className={testCase.passed ? "text-[#2db55d]" : "text-[#ff5555]"}>■</span> Case {caseIndex + 1}
                </span>
              ))}
            </div>

            <div className="mb-2 text-xs font-semibold text-[#a8a8a8]">Code</div>
            <pre className="max-h-72 overflow-auto rounded-lg bg-[#171717] p-4 text-xs leading-5 text-[#e7e7e7]">
              <code>{submission.code}</code>
            </pre>
          </div>
        </article>
      ))}
    </div>
  );
}
