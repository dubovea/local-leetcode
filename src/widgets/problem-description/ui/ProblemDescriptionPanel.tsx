import { useEffect, useRef, useState } from "react";
import { BookOpen, CheckCircle2, Eye, FileText, Pencil, ScrollText } from "lucide-react";
import type { Problem, ProblemListItem } from "@/entities/problem/model/types";
import { DifficultyBadge } from "@/shared/ui/DifficultyBadge";
import { MarkdownView } from "@/shared/ui/MarkdownView";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";
import { SolutionsHistory } from "@/features/solutions-history/ui/SolutionsHistory";
import { PatternGuide } from "@/features/pattern-guide/ui/PatternGuide";

type Tab = "description" | "solutions" | "patterns";

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
  problemIndex,
  onChange,
  onSelectProblem,
  onRestoreSubmission,
  onDeleteSubmission,
}: {
  problem: Problem;
  problemIndex: ProblemListItem[];
  onChange: (problem: Problem) => void;
  onSelectProblem: (problemId: string) => void;
  onRestoreSubmission: (submissionId: string) => void;
  onDeleteSubmission: (submissionId: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("description");
  const [editingMarkdown, setEditingMarkdown] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollPositionsRef = useRef<Record<Tab, number>>({
    description: 0,
    solutions: 0,
    patterns: 0,
  });
  const topics = normalizeTopics(problem.topics);
  const visibleTopics =
    topics.length > 0 ? topics : topicsFromMarkdown(problem.descriptionMarkdown);
  const previewMarkdown = withoutLeadingTitle(
    visibleTopics.length > 0
      ? withoutTopicsSection(problem.descriptionMarkdown)
      : problem.descriptionMarkdown,
  );
  const solved = problem.submissions.some((submission) => submission.status === "accepted");
  const EditIcon = editingMarkdown ? Eye : Pencil;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollPositionsRef.current[tab] ?? 0;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [tab]);

  function rememberScroll(currentTab: Tab) {
    if (scrollRef.current) {
      scrollPositionsRef.current[currentTab] = scrollRef.current.scrollTop;
    }
  }

  function changeTab(nextTab: string) {
    rememberScroll(tab);
    setTab(nextTab as Tab);
  }

  function openLinkedProblem(problemId: string) {
    changeTab("description");
    onSelectProblem(problemId);
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel)]">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-[var(--lc-border)] bg-[var(--lc-panel-header)] px-3">
        <Tabs className="min-w-0" value={tab} onValueChange={changeTab}>
          <TabsList className="h-8 bg-transparent p-0" variant="line">
            <TabsTrigger
              className="h-8 rounded-md px-3 text-sm text-[var(--lc-muted)] data-active:bg-[var(--lc-active)] data-active:text-[var(--lc-text-strong)]"
              value="description"
            >
              <FileText className="h-4 w-4" />
              Описание
            </TabsTrigger>
            <TabsTrigger
              className="h-8 rounded-md px-3 text-sm text-[var(--lc-muted)] data-active:bg-[var(--lc-active)] data-active:text-[var(--lc-text-strong)]"
              value="solutions"
            >
              <ScrollText className="h-4 w-4" />
              Решения
            </TabsTrigger>
            <TabsTrigger
              className="h-8 rounded-md px-3 text-sm text-[var(--lc-muted)] data-active:bg-[var(--lc-active)] data-active:text-[var(--lc-text-strong)]"
              value="patterns"
            >
              <BookOpen className="h-4 w-4" />
              Паттерны
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {solved ? (
          <div className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-[var(--lc-success)]">
            <CheckCircle2 className="h-4 w-4" />
            Решено
          </div>
        ) : null}
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto p-5"
        onScroll={() => rememberScroll(tab)}
      >
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
                {editingMarkdown ? "Предпросмотр" : "Править"}
              </Button>
            </div>

            {editingMarkdown ? (
              <Textarea
                className="min-h-[420px] resize-y font-mono text-xs leading-5"
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
              <div className="mb-2 text-sm font-semibold text-[var(--lc-text-strong)]">
                Заметки
              </div>
              <Textarea
                className="min-h-40 resize-y font-mono text-xs leading-5"
                placeholder="Идея решения, крайние случаи или сложность алгоритма..."
                value={problem.notesMarkdown ?? ""}
                onChange={(event) => onChange({ ...problem, notesMarkdown: event.target.value })}
                spellCheck={false}
              />
            </div>
          </div>
        ) : tab === "solutions" ? (
          <SolutionsHistory
            submissions={problem.submissions}
            onRestore={onRestoreSubmission}
            onDelete={onDeleteSubmission}
          />
        ) : (
          <PatternGuide problems={problemIndex} onSelectProblem={openLinkedProblem} />
        )}
      </div>
    </section>
  );
}
