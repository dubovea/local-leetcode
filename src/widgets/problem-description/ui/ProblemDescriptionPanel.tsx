import { useState } from "react";
import { Eye, FileText, Pencil, ScrollText } from "lucide-react";
import type { Problem } from "@/entities/problem/model/types";
import { DifficultyBadge } from "@/shared/ui/DifficultyBadge";
import { MarkdownView } from "@/shared/ui/MarkdownView";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { cn } from "@/shared/lib/cn";
import { SolutionsHistory } from "@/features/solutions-history/ui/SolutionsHistory";

type Tab = "description" | "solutions";

function normalizeTopics(topics?: string[]) {
  return Array.from(new Set((topics ?? []).map((topic) => topic.trim()).filter(Boolean)));
}

function topicsFromMarkdown(markdown: string) {
  const match = /(?:^|\n)## Topics\s*\n+([\s\S]*?)(?=\n##\s+|\n#\s+|$)/i.exec(markdown);

  if (!match) {
    return [];
  }

  return normalizeTopics(
    match[1]
      .split("\n")
      .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
      .filter((line) => line && !line.startsWith("#")),
  );
}

function withoutTopicsSection(markdown: string) {
  return markdown.replace(/\n{0,2}## Topics\s*\n+[\s\S]*?(?=\n##\s+|\n#\s+|$)/i, "\n\n").trim();
}

function withoutLeadingTitle(markdown: string) {
  return markdown.replace(/^#\s+.+(?:\n+|$)/, "").trim();
}

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
  const topics = normalizeTopics(problem.topics);
  const visibleTopics =
    topics.length > 0 ? topics : topicsFromMarkdown(problem.descriptionMarkdown);
  const previewMarkdown = withoutLeadingTitle(
    visibleTopics.length > 0
      ? withoutTopicsSection(problem.descriptionMarkdown)
      : problem.descriptionMarkdown,
  );
  const EditIcon = editingMarkdown ? Eye : Pencil;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel)]">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-[var(--lc-border)] bg-[var(--lc-panel-header)] px-3">
        <button
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "description"
              ? "bg-[var(--lc-active)] text-[var(--lc-text-strong)]"
              : "text-[var(--lc-muted)] hover:bg-[var(--lc-hover)]",
          )}
          type="button"
          onClick={() => setTab("description")}
        >
          <FileText className="h-4 w-4" />
          Description
        </button>
        <button
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "solutions"
              ? "bg-[var(--lc-active)] text-[var(--lc-text-strong)]"
              : "text-[var(--lc-muted)] hover:bg-[var(--lc-hover)]",
          )}
          type="button"
          onClick={() => setTab("solutions")}
        >
          <ScrollText className="h-4 w-4" />
          Solutions
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-5">
        {tab === "description" ? (
          <div>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="mb-3 text-2xl font-semibold text-[var(--lc-text-strong)]">
                  {problem.number}. {problem.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <DifficultyBadge difficulty={problem.difficulty} />
                  {visibleTopics.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full bg-[var(--lc-topic-bg)] px-2.5 py-1 text-xs font-medium text-[var(--lc-topic-text)]"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <Button onClick={() => setEditingMarkdown((value) => !value)} variant="ghost">
                <EditIcon className="h-4 w-4" />
                {editingMarkdown ? "Preview" : "Edit"}
              </Button>
            </div>

            {editingMarkdown ? (
              <Textarea
                className="min-h-[420px] resize-y font-mono leading-6"
                value={problem.descriptionMarkdown}
                onChange={(event) =>
                  onChange({ ...problem, descriptionMarkdown: event.target.value })
                }
                spellCheck={false}
              />
            ) : (
              <MarkdownView markdown={previewMarkdown} />
            )}

            <div className="mt-6 border-t border-[var(--lc-border)] pt-5">
              <div className="mb-2 text-sm font-semibold text-[var(--lc-text-strong)]">Notes</div>
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
          <SolutionsHistory
            submissions={problem.submissions}
            onRestore={onRestoreSubmission}
            onDelete={onDeleteSubmission}
          />
        )}
      </div>
    </section>
  );
}
