import { useState } from "react";
import type { Problem } from "@/entities/problem/model/types";
import { DifficultyBadge } from "@/shared/ui/DifficultyBadge";
import { MarkdownView } from "@/shared/ui/MarkdownView";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { cn } from "@/shared/lib/cn";
import { SolutionsHistory } from "@/features/solutions-history/ui/SolutionsHistory";

type Tab = "description" | "solutions";

export function ProblemDescriptionPanel({
  problem,
  onChange,
  onRestoreSubmission,
  onDeleteSubmission,
}: {
  problem: Problem;
  onChange: (problem: Problem) => void;
  onRestoreSubmission: (submissionId: string) => void;
  onDeleteSubmission: (submissionId: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("description");
  const [editingMarkdown, setEditingMarkdown] = useState(false);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[#303030] bg-[#1f1f1f]">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-[#303030] bg-[#252525] px-3">
        <button
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "description" ? "bg-[#333] text-[#f2f2f2]" : "text-[#a8a8a8] hover:bg-[#303030]",
          )}
          type="button"
          onClick={() => setTab("description")}
        >
          Description
        </button>
        <button
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "solutions" ? "bg-[#333] text-[#f2f2f2]" : "text-[#a8a8a8] hover:bg-[#303030]",
          )}
          type="button"
          onClick={() => setTab("solutions")}
        >
          Solutions
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-5">
        {tab === "description" ? (
          <div>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h1 className="mb-2 text-2xl font-semibold text-[#f1f1f1]">
                  {problem.number}. {problem.title}
                </h1>
                <DifficultyBadge difficulty={problem.difficulty} />
              </div>
              <Button onClick={() => setEditingMarkdown((value) => !value)} variant="ghost">
                {editingMarkdown ? "Preview" : "Edit Markdown"}
              </Button>
            </div>

            {editingMarkdown ? (
              <Textarea
                className="min-h-[420px] resize-y font-mono leading-6"
                value={problem.descriptionMarkdown}
                onChange={(event) => onChange({ ...problem, descriptionMarkdown: event.target.value })}
                spellCheck={false}
              />
            ) : (
              <MarkdownView markdown={problem.descriptionMarkdown} />
            )}

            <div className="mt-6 border-t border-[#303030] pt-5">
              <div className="mb-2 text-sm font-semibold text-[#f1f1f1]">Notes</div>
              <Textarea
                className="min-h-40 resize-y font-mono leading-6"
                placeholder="Write your idea, edge cases, or complexity notes here..."
                value={problem.notesMarkdown ?? ""}
                onChange={(event) => onChange({ ...problem, notesMarkdown: event.target.value })}
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          <SolutionsHistory submissions={problem.submissions} onRestore={onRestoreSubmission} onDelete={onDeleteSubmission} />
        )}
      </div>
    </section>
  );
}
