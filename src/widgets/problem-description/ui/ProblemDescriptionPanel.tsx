import { memo, useCallback, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Eye, FileText, Lightbulb, Pencil, ScrollText } from "lucide-react";

import type { Problem, ProblemListItem } from "@/entities/problem/model/types";
import { DifficultyBadge } from "@/shared/ui/DifficultyBadge";
import { MarkdownView } from "@/shared/ui/MarkdownView";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";
import { SolutionsHistory } from "@/features/solutions-history/ui/SolutionsHistory";
import { PatternGuide } from "@/features/pattern-guide/ui/PatternGuide";

type Tab = "description" | "solutions" | "patterns";

const tabsTriggerClassName =
  "h-8 gap-1.5 rounded-md px-3 text-sm text-[var(--lc-muted)] shadow-none data-[state=active]:bg-[var(--lc-active)] data-[state=active]:text-[var(--lc-text-strong)]";

const tabsContentClassName = "m-0 h-full min-h-0 overflow-auto p-5 data-[state=inactive]:hidden";

const MemoSolutionsHistory = memo(SolutionsHistory);
const MemoPatternGuide = memo(PatternGuide);

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

function withoutHintsSection(markdown: string) {
  return markdown.replace(/\n{0,2}## Hints\s*\n+[\s\S]*?(?=\n##\s+|\n#\s+|$)/i, "\n\n").trim();
}

function withoutLeadingTitle(markdown: string) {
  return markdown.replace(/^#\s+.+(?:\n+|$)/, "").trim();
}

function sameStringArray(a?: string[], b?: string[]) {
  if (a === b) {
    return true;
  }

  if (!a || !b || a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
}

function cleanHintText(hint: string) {
  return hint
    .replace(/<\/?code>/g, "`")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function HintsHover({ hints }: { hints: string[] }) {
  if (hints.length === 0) {
    return null;
  }

  return (
    <div className="group/hints relative inline-flex">
      <button
        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-[var(--lc-warning)] transition-colors hover:bg-[var(--lc-hover)] focus-visible:bg-[var(--lc-hover)] focus-visible:outline-none"
        type="button"
      >
        <Lightbulb className="h-4 w-4" />
        Hints
      </button>

      <div className="pointer-events-none absolute right-0 top-full z-30 mt-2 hidden w-96 max-w-[calc(100vw-48px)] rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel-raised)] p-3 text-xs text-[var(--lc-text)] shadow-xl group-hover/hints:block group-focus-within/hints:block">
        <div className="mb-2 font-semibold text-[var(--lc-text-strong)]">Hints</div>
        <ol className="space-y-2">
          {hints.map((hint, index) => (
            <li key={`${index}-${hint}`} className="leading-5">
              <span className="font-semibold text-[var(--lc-muted)]">{index + 1}. </span>
              {cleanHintText(hint)}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export const ProblemDescriptionPanel = memo(
  function ProblemDescriptionPanel({
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

    const topics = useMemo(() => {
      return normalizeTopics(problem.topics);
    }, [problem.topics]);

    const visibleTopics = useMemo(() => {
      return topics.length > 0 ? topics : topicsFromMarkdown(problem.descriptionMarkdown);
    }, [topics, problem.descriptionMarkdown]);

    const hints = useMemo(() => {
      return (problem.hints ?? []).map(cleanHintText).filter(Boolean);
    }, [problem.hints]);

    const previewMarkdown = useMemo(() => {
      const withoutTopics =
        visibleTopics.length > 0
          ? withoutTopicsSection(problem.descriptionMarkdown)
          : problem.descriptionMarkdown;
      const markdown = withoutHintsSection(withoutTopics);

      return withoutLeadingTitle(markdown);
    }, [problem.descriptionMarkdown, visibleTopics.length]);

    const solved = useMemo(() => {
      return problem.submissions.some((submission) => submission.status === "accepted");
    }, [problem.submissions]);

    const EditIcon = editingMarkdown ? Eye : Pencil;

    const changeTab = useCallback((nextTab: string) => {
      setTab(nextTab as Tab);
    }, []);

    const openLinkedProblem = useCallback(
      (problemId: string) => {
        setTab("description");
        onSelectProblem(problemId);
      },
      [onSelectProblem],
    );

    return (
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel)]">
        <Tabs className="flex h-full min-h-0 flex-col" value={tab} onValueChange={changeTab}>
          <div className="flex h-11 shrink-0 items-center gap-2 border-b border-[var(--lc-border)] bg-[var(--lc-panel-header)] px-3">
            <TabsList className="h-8 bg-transparent p-0" variant="line">
              <TabsTrigger className={tabsTriggerClassName} value="description">
                <FileText className="h-4 w-4" />
                Описание
              </TabsTrigger>

              <TabsTrigger className={tabsTriggerClassName} value="solutions">
                <ScrollText className="h-4 w-4" />
                Решения
              </TabsTrigger>

              <TabsTrigger className={tabsTriggerClassName} value="patterns">
                <BookOpen className="h-4 w-4" />
                Паттерны
              </TabsTrigger>
            </TabsList>

            {solved ? (
              <div className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-[var(--lc-success)]">
                <CheckCircle2 className="h-4 w-4" />
                Решено
              </div>
            ) : null}
          </div>

          <div className="min-h-0 flex-1">
            <TabsContent forceMount className={tabsContentClassName} value="description">
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

                  <HintsHover hints={hints} />

                  <Button variant="ghost" onClick={() => setEditingMarkdown((value) => !value)}>
                    <EditIcon className="h-4 w-4" />
                    {editingMarkdown ? "Предпросмотр" : "Править"}
                  </Button>
                </div>

                {editingMarkdown ? (
                  <Textarea
                    className="min-h-[420px] resize-y font-mono text-xs leading-5"
                    value={problem.descriptionMarkdown}
                    onChange={(event) =>
                      onChange({
                        ...problem,
                        descriptionMarkdown: event.target.value,
                      })
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
                    onChange={(event) =>
                      onChange({
                        ...problem,
                        notesMarkdown: event.target.value,
                      })
                    }
                    spellCheck={false}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent forceMount className={tabsContentClassName} value="solutions">
              <MemoSolutionsHistory
                submissions={problem.submissions}
                onRestore={onRestoreSubmission}
                onDelete={onDeleteSubmission}
              />
            </TabsContent>

            <TabsContent forceMount className={tabsContentClassName} value="patterns">
              <MemoPatternGuide problems={problemIndex} onSelectProblem={openLinkedProblem} />
            </TabsContent>
          </div>
        </Tabs>
      </section>
    );
  },
  (prev, next) => {
    return (
      prev.problem.id === next.problem.id &&
      prev.problem.number === next.problem.number &&
      prev.problem.title === next.problem.title &&
      prev.problem.difficulty === next.problem.difficulty &&
      prev.problem.descriptionMarkdown === next.problem.descriptionMarkdown &&
      prev.problem.notesMarkdown === next.problem.notesMarkdown &&
      prev.problem.submissions === next.problem.submissions &&
      sameStringArray(prev.problem.hints, next.problem.hints) &&
      sameStringArray(prev.problem.topics, next.problem.topics) &&
      prev.problemIndex === next.problemIndex &&
      prev.onChange === next.onChange &&
      prev.onSelectProblem === next.onSelectProblem &&
      prev.onRestoreSubmission === next.onRestoreSubmission &&
      prev.onDeleteSubmission === next.onDeleteSubmission
    );
  },
);
